import { debounce, throttle } from "./l.js";

const BatchState = {
    INIT: 0,
    LINE_UPDATE: 1,
    LINE_MEASURE: 2,
    WORD_UPDATE: 3,
    WORD_MEASURE: 4,
    WORD_BREAK: 5,
    PUSH_CHILDREN: 6,
    BATCH_END: 7,
    TEST_INLINE: 8,
    TEST_MEASURE: 9,
    TEST_APPLY: 10,
    TEST_SEARCH_INIT: 11,
    TEST_LINEAR_GT: 12,
    TEST_LINEAR_LT: 13,
    TEST_LINEAR_GT_UPDATE: 14,
    TEST_LINEAR_LT_UPDATE: 15,
    TEST_BINARY: 16,
    TEST_BINARY_UPDATE: 17,
    TEST_BINARY_CMP: 18,
    TEST_END: 19
}
function normalizeBatch(list) {
    const batch = list.filter(line => line.el.children.length === 0 && line.time != null).map(line => ({ el: line.el, state: BatchState.INIT }));
    const batch2 = [];
    let complete = 0;
    while (complete < batch.length) {
        for (const item of batch) switch (item.state) {
            case BatchState.INIT:
                item.words = item.el.textContent.split(/\s+/);
                item.el.textContent = "";
                item.el.style.paddingLeft = "1px";
                item.i = 0;
            case BatchState.LINE_UPDATE:
                if (item.i === item.words.length) {
                    item.state = BatchState.PUSH_CHILDREN;
                    break;
                }
                item.line = document.createElement("div");
                item.str = item.words[item.i++];
                item.line.textContent = item.str;
                item.el.append(item.line);
                item.state = BatchState.LINE_MEASURE;
                break;
            case BatchState.WORD_UPDATE:
                if (item.i === item.words.length) {
                    item.state = BatchState.PUSH_CHILDREN;
                    break;
                }
                item.testStr = item.str + " " + item.words[item.i];
                item.line.textContent = item.testStr;
                item.state = BatchState.WORD_MEASURE;
                break;
            case BatchState.WORD_BREAK:
                item.line.textContent = item.str;
                item.state = BatchState.LINE_UPDATE;
                break;
            case BatchState.BATCH_END:
                item.el.style.removeProperty("padding-left");
                item.state = null;
                break;
        }
        for (const item of batch) switch (item.state) {
            case BatchState.LINE_MEASURE:
                item.baseHeight = item.line.offsetHeight;
                item.state = BatchState.WORD_UPDATE;
                break;
            case BatchState.WORD_MEASURE:
                if (item.line.offsetHeight > item.baseHeight) {
                    item.state = BatchState.WORD_BREAK;
                    break;
                }
                item.str = item.testStr;
                item.i++;
                item.state = BatchState.WORD_UPDATE;
                break;
            case BatchState.PUSH_CHILDREN:
                for (let i = 0; i < item.el.children.length; i++)
                    batch2.push({ i, parent: item.el, el: item.el.children[i], state: BatchState.TEST_INLINE, min: 100, max: 100 });
                item.state = BatchState.BATCH_END;
                item.el._children = [];
                complete++;
        }
    }
    complete = 0;
    while (complete < batch2.length) {
        for (const item of batch2) switch (item.state) {
            case BatchState.TEST_INLINE:
                const tmp = item.parent.cloneNode();
                item.el.remove();
                tmp.append(item.el);
                item.parent.parentElement.append(tmp);
                item.el.style.display = "inline-block";
                item.state = BatchState.TEST_MEASURE;
                break;
            case BatchState.TEST_APPLY:
                item.el.parentElement.classList.add("active");
                item.state = BatchState.TEST_SEARCH_INIT;
                break;
            case BatchState.TEST_LINEAR_GT_UPDATE:
                item.el.style.fontSize = `${item.min}%`;
                item.state = BatchState.TEST_LINEAR_GT;
                break;
            case BatchState.TEST_LINEAR_LT_UPDATE:
                item.el.style.fontSize = `${item.max}%`;
                item.state = BatchState.TEST_LINEAR_LT;
                break;
            case BatchState.TEST_BINARY_UPDATE:
                item.size = (item.min + item.max) / 2;
                item.el.style.fontSize = `${item.size}%`;
                item.state = BatchState.TEST_BINARY_CMP;
                break;
            case BatchState.TEST_END:
                item.el.dataset.scale = item.size || "100%";
                item.el.style.removeProperty("font-size");
                item.el.style.display = "block";
                item.el.parentElement.remove();
                item.parent._children[item.i] = item.el;
                complete++;
                item.state = null;
        }
        for (const item of batch2) switch (item.state) {
            case BatchState.TEST_MEASURE:
                item.width = item.el.scrollWidth;
                item.state = BatchState.TEST_APPLY;
                break;
            case BatchState.TEST_SEARCH_INIT:
                if (item.el.scrollWidth < item.width) {
                    item.state = BatchState.TEST_LINEAR_LT;
                    break;
                }
            case BatchState.TEST_LINEAR_GT:
                if (item.el.scrollWidth <= item.width) {
                    item.state = BatchState.TEST_BINARY;
                    break;
                }
                item.max = item.min;
                item.min--;
                item.state = BatchState.TEST_LINEAR_GT_UPDATE;
                break;
            case BatchState.TEST_LINEAR_LT:
                if (item.el.scrollWidth >= item.width) {
                    item.state = BatchState.TEST_BINARY;
                    break;
                }
                item.min = item.max;
                item.max++;
                item.state = BatchState.TEST_LINEAR_LT_UPDATE;
                break;
            case BatchState.TEST_BINARY_CMP:
                if (item.el.scrollWidth > item.width) item.max = item.size;
                else item.min = item.size;
            case BatchState.TEST_BINARY:
                if (Math.abs(item.el.scrollWidth - item.width) < 1) {
                    item.size = item.el.style.fontSize;
                    item.state = BatchState.TEST_END;
                    break;
                }
                item.state = BatchState.TEST_BINARY_UPDATE;
                break;

        }
    }
    for (const { el } of batch) {
        el.append(...el._children);
        delete el._children;
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
    const t = performance.now();
    for (const line of lines) {
        signal?.throwIfAborted();
        if (line.el) {
            if (line.el.isConnected) continue;
            if (line.el.classList.contains("active")) disableLine(line.el);
            root.append(line.el);
        }
        else renderLine(line, root);
    }
    if (lines.normWidth && lines.normWidth !== root.offsetWidth)
        lines.forEach(line => line.el.replaceChildren(line.text));
    normalizeBatch(lines);
    lines.normWidth = root.offsetWidth;
    console.debug("render took", (performance.now() - t).toFixed(2), "ms");
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
    if (onMenu) {
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
    }
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
    let observer;
    try {
        signal?.addEventListener("abort", () => {
            status?.disable();
            root.remove();
            observer?.disconnect();
        });
        root.className = "lyrics";
        root.style.position = "relative";
        root.q(".overlay")?.remove(); 
        status?.enable();
        renderLines(lines, root, signal);
        status?.disable();
        if (prefetch) return lines;
        if (!timed) {
            addOverlay(root);
            return;
        }
        const { timeObj, onMenu } = timingMenu(id, signal);
        const overlay = addOverlay(root, onMenu);
        const sync = syncButton(root);
        sync.onclick = () => {
            root.scrollTo(0, scrollTarget.offsetTop);
            sync.remove();
        }
        let currentLine, scrollTarget = lines[0].el, snapped = true;
        const select = el => {
            if (currentLine) disableLine(currentLine);
            enableLine(el);
            currentLine = el;
            scrollTarget = el.previousElementSibling ?? el;
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
        const scrollUpdate = throttle(() => snapped = Math.abs(root.scrollTop - Math.min(scrollTarget.offsetTop, root.scrollHeight - root.clientHeight)) < 10);
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
        const forceScroll = debounce(() => scrollTarget.scrollIntoView());
        const normalize = throttle(() => {
            if (lines.normWidth === root.offsetWidth) return;
            lines.normWidth = root.offsetWidth;
            lines.forEach(line => line.el.replaceChildren(line.text));
            normalizeBatch(lines);
            scrollTarget.scrollIntoView();
        });
        observer = new ResizeObserver(() => {
            forceScroll();
            normalize();
        });
        observer.observe(root);
    } catch (err) {
        console.error(err.stack);
        status?.disable();
        root.remove();
    }
}
