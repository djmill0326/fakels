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
        lines.push({
            time: m * 60 + s, 
            text: line.slice(timeEnd + 1).trim(),
        });
    }
    return lines;
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

function syncButton() {
    const overlay = document.createElement("div");
    overlay.className = "sync";
    overlay.style.position = "sticky";
    overlay.style.bottom = 0;
    overlay.style.pointerEvents = "none";
    const sync = document.createElement("button");
    sync.innerText = "Sync";
    sync.style.position = "absolute";
    sync.style.bottom = 0;
    sync.style.right = 0;
    sync.style.pointerEvents = "auto";
    overlay.append(sync);
    return overlay;
};

export function showLyrics(id, lines, root, audio, { status, prefetch, signal }) {
    if (signal?.aborted) return;
    try {
        root.className = "lyrics";
        root.style.position = "relative";
        root.q(".sync")?.remove(); 
        status?.enable();
        renderLines(lines, root, signal);
        status?.disable();
        if (prefetch) return lines;
        const sync = syncButton(root);
        sync.children[0].onclick = () => {
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
            audio.currentTime = parseFloat(target.dataset.time);
            audio.play();
        }, { signal });
        const scrollUpdate = debounce(() => snapped = Math.abs(root.scrollTop - Math.min(scrollPosition, root.scrollHeight - root.clientHeight)) < 10);
        root.addEventListener("scroll", scrollUpdate, { signal });
        root.addEventListener("scrollend", () => setTimeout(() => snapped ? sync.remove() : sync.isConnected || root.append(sync), 100), { signal });
        audio.addEventListener("timeupdate", () => {
            if (!audio.src.includes(id)) return;
            for (let i = lines.length - 1; i >= 0; i--) {
                const { time, el } = lines[i];
                if (time !== undefined && audio.currentTime + .001 >= time) {
                    if (currentLine !== el) select(el);
                    break;
                }
            }
        }, { signal });
        signal?.addEventListener("abort", () => {
            status?.disable();
            root.remove();
        });
    } catch (err) {
        status?.disable();
        root.remove();
    }
}
