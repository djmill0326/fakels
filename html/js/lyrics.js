import { debounce } from "./l.js";

function normalizeWidth(el) {
    const words = el.textContent.split(/\s+/);
    el.textContent = "";
    el.style.paddingLeft = "1px";
    let i = 0;

    while (i < words.length) {
        const line = document.createElement("div");
        let str = words[i++];
        line.textContent = str;
        el.append(line);

        const baseHeight = line.offsetHeight;

        while (i < words.length) {
            const testStr = str + " " + words[i];
            line.textContent = testStr;
            if (line.offsetHeight > baseHeight) {
                line.textContent = str;
                break;
            }
            str = testStr;
            i++;
        }
    }

    el.style.removeProperty("padding-left");
    Array.from(el.children).forEach(testLine);

    function testLine(line) {
        line.style.display = "inline-block";
        const width = line.scrollWidth;
        el.classList.add("active");
        let min = 100, max = 100;

        if (line.scrollWidth < width) {
            while (line.scrollWidth < width) {
                min = max;
                max += 1;
                line.style.fontSize = max + "%";
            }
        } else {
            while (line.scrollWidth > width) {
                max = min;
                min -= 1;
                line.style.fontSize = min + "%";
            }
        }

        while (Math.abs(line.scrollWidth - width) >= 1) {
            const size = (max + min) / 2;
            line.style.fontSize = size + "%";
            if (line.scrollWidth > width) max = size;
            else min = size;
        }

        line.dataset.scale = line.style.fontSize || "100%";
        line.style.removeProperty("font-size");
        line.style.display = "block";
        el.classList.remove("active");
    }
}

export function parseLyrics(text) {
    const lines = [];
    let timed = false;
    for (let line of text.split("\n")) {
        line = line.trim();
        if (!line.startsWith("[")) {
            lines.push({ text: line });
            continue;
        }
        const timeEnd = line.indexOf("]");
        if (timeEnd === -1) continue;
        const timeStr = line.slice(1, timeEnd);
        const [m, s] = timeStr.split(":").map(Number);
        if (isNaN(m) || isNaN(s)) continue;
        timed = true;
        lines.push({
            time: m * 60 + s, 
            text: line.slice(timeEnd + 1).trim(),
        });
    }
    return { lines, timed };
};

function renderLine(line, root) {
    const el = document.createElement("a");
    el.className = "lyrics-text";
    el.innerText = line.text || "♫";
    el.style.display = "block";
    root.append(el);
    if(line.time !== undefined) {
        el.dataset.time = line.time.toFixed(2);
        el.href = "#";
        el.onclick = ev => ev.preventDefault();
        normalizeWidth(el);
    }
    line.el = el;
}

function enableLine(line) {
    line.classList.add("active");
    for (const el of line.children)
        el.style.fontSize = el.dataset.scale;
}

function disableLine(line) {
    line.classList.remove("active");
    for (const el of line.children)
        el.style.removeProperty("font-size");
}

function renderLines(lines, root, signal) {
    for (const line of lines) {
        signal?.throwIfAborted();
        if (line.el) {
            if (line.el.isConnected) continue;
            if (line.el.classList.contains("active")) disableLine(line.el);
            root.append(line.el);
        }
        else renderLine(line, root);
    }
}

let timing;
function loadTiming(id) {
    if (!timing) timing = JSON.parse(localStorage.getItem("lyrics-timing") || "{}");
    return timing[id];
}

function updateTiming({ id, offset }) {
    if ((timing[id] ?? 0) === offset) return;
    if (offset === 0) delete timing[id];
    else timing[id] = offset;
    localStorage.setItem("lyrics-timing", JSON.stringify(timing));
}

function getOffset({ offset }) {
    return offset / 1000;
}

function timingMenu(id, signal) {
    const timeObj = { id, offset: loadTiming(id) || 0 };
    const updateTimeStr = () => 
        offset.textContent = `${getOffset(timeObj).toFixed(1)}s`;
    const changeOffset = (value) => {
        timeObj.offset = value === "reset" ? 0 : timeObj.offset + value;
        updateTimeStr();
    };
    const offsetButton = (text, num) => {
        const el = document.createElement("button");
        el.style.touchAction = "none";
        el.textContent = text;
        let timeout, interval;
        el.onpointerdown = (ev) => {
            if (!ev.isPrimary) return;
            timeout = setTimeout(() => {
                interval = setInterval(() => changeOffset(num), 100);
                timeout = setTimeout(() => {
                    clearInterval(interval);
                    interval = setInterval(() => changeOffset(num), 50);
                }, 2000);
            }, 500);
            el.releasePointerCapture(ev.pointerId);
        }
        el.onpointercancel = el.onpointerleave = (ev) => {
            if (!ev.isPrimary) return;
            clearTimeout(timeout);
            clearInterval(interval);
            interval = null;
        }
        el.onpointerup = (ev) => {
            if (ev.isPrimary && !interval) changeOffset(num);
        };
        return el;
    };
    const dec = offsetButton("-", -100);
    const inc = offsetButton("+", 100);
    const offset = document.createElement("button");
    offset.onclick = () => changeOffset("reset");
    updateTimeStr();
    signal?.addEventListener("abort", () => updateTiming(timeObj));
    return { timeObj, onMenu: (slot, open) => {
        if (open) slot.append(dec, offset, inc);
        else {
            slot.replaceChildren();
            updateTiming(timeObj);
        }
    }};
}

function addOverlay(root, onMenu) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.style.position = "sticky";
    overlay.style.bottom = 0;
    overlay.style.pointerEvents = "none";
    const wrapper = document.createElement("span");
    wrapper.style.display = "flex";
    wrapper.style.position = "absolute";
    wrapper.style.gap = "5px";
    wrapper.style.bottom = "5px";
    wrapper.style.right = "5px";
    wrapper.style.pointerEvents = "auto";
    let menuOpened = false;
    const slot = document.createElement("span");
    slot.style.display = "flex";
    slot.style.gap = "5px";
    const menu = document.createElement("button");
    menu.className = "menu-btn";
    menu.textContent = "‹";
    menu.style.fontWeight = "bold";
    menu.onclick = () => {
        onMenu(slot, menuOpened = !menuOpened);
        menu.textContent = menuOpened ? "›" : "‹";
        if (menuOpened) menu.insertAdjacentElement("beforebegin", slot);
        else slot.remove();
    }
    wrapper.append(menu);
    overlay.append(wrapper);
    root.append(overlay);
    return wrapper;
}

function syncButton() {
    const sync = document.createElement("button");
    sync.innerText = "Sync";
    return sync;
};

export function showLyrics(id, { lines, timed }, root, audio, { status, prefetch, signal }) {
    if (signal?.aborted) return;
    try {
        signal?.addEventListener("abort", () => {
            status?.disable();
            root.remove();
        });
        root.className = "lyrics";
        root.style.position = "relative";
        root.q(".overlay")?.remove(); 
        status?.enable();
        renderLines(lines, root, signal);
        status?.disable();
        if (prefetch) return lines;
        if (!timed) return;
        const { timeObj, onMenu } = timingMenu(id, signal);
        const overlay = addOverlay(root, onMenu);
        const sync = syncButton(root);
        sync.onclick = () => {
            root.scrollTo(0, scrollPosition);
            sync.remove();
        }
        let currentLine, scrollPosition = 0, snapped = true;
        const select = el => {
            if (currentLine) disableLine(currentLine);
            enableLine(el);
            currentLine = el;
            const scrollTarget = el.previousElementSibling ?? el;
            scrollPosition = scrollTarget.offsetTop;
            if (snapped) scrollTarget.scrollIntoView({ behavior: "smooth" });
        }
        const isLyrics = el => el?.classList.contains("lyrics-text");
        root.addEventListener("click", ev => {
            let target = isLyrics(ev.target) ? ev.target : isLyrics(ev.target.parentElement) ? ev.target.parentElement : undefined;
            if (!target) return;
            if (!audio.src.includes(id) || !target.dataset.time) return;
            snapped = true;
            select(target);
            audio.currentTime = parseFloat(target.dataset.time) + getOffset(timeObj);
            audio.play();
        }, { signal });
        const scrollUpdate = debounce(() => snapped = Math.abs(root.scrollTop - Math.min(scrollPosition, root.scrollHeight - root.clientHeight)) < 10);
        root.addEventListener("scroll", scrollUpdate, { signal });
        root.addEventListener("scrollend", () => setTimeout(() => snapped ? sync.remove() : sync.isConnected || overlay.prepend(sync), 100), { signal });
        audio.addEventListener("timeupdate", () => {
            if (!audio.src.includes(id)) return;
            for (let i = lines.length - 1; i >= 0; i--) {
                const { time, el } = lines[i];
                if (time !== undefined && audio.currentTime + .001 >= time + getOffset(timeObj)) {
                    if (currentLine !== el) select(el);
                    break;
                }
            }
        }, { signal });
    } catch (err) {
        status?.disable();
        root.remove();
    }
}
