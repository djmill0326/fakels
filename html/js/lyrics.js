import $, { debounce, throttle, overlay, handleHold, stepInterval, withinBottom, scrolledToBottom, easeInOut } from "./l.js";

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
    TEST_SCALE: 11,
    TEST_END: 12
}
function normalizeBatch(list) {
    const batch = list.filter(line => line.el.children.length === 0 && line.time != null).map(line => ({
        state: BatchState.INIT,
        el: line.el,
        i: 0,
        words: null,
        line: null,
        str: null,
        testStr: null,
        baseHeight: 0
    }));
    const batch2 = [];
    let complete = 0;
    while (complete < batch.length) {
        for (const item of batch) switch (item.state) {
            case BatchState.INIT:
                item.words = item.el.textContent.split(/\s+/);
                item.el.textContent = "";
                item.el.style.paddingLeft = "5px";
                item.i = 0;
            case BatchState.LINE_UPDATE:
                if (item.i === item.words.length) {
                    item.state = BatchState.PUSH_CHILDREN;
                    break;
                }
                item.line = $("div");
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
                item.state = -1;
                complete++;
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
                    batch2.push({
                        state: BatchState.TEST_INLINE,
                        el: item.el.children[i],
                        width: 0,
                    });
                item.state = BatchState.BATCH_END;
        }
    }
    complete = 0;
    while (complete < batch2.length) {
        for (const item of batch2) switch (item.state) {
            case BatchState.TEST_INLINE:
                item.el.style.display = "inline-block";
                item.state = BatchState.TEST_MEASURE;
                break;
            case BatchState.TEST_APPLY:
                item.el.classList.add("active");
                item.state = BatchState.TEST_SCALE;
                break;
            case BatchState.TEST_END:
                item.el.style.removeProperty("font-size");
                item.el.classList.remove("active");
                item.el.style.display = "block";
                complete++;
                item.state = -1;
        }
        for (const item of batch2) switch (item.state) {
            case BatchState.TEST_MEASURE:
                item.width = item.el.scrollWidth;
                item.state = BatchState.TEST_APPLY;
                break;
            case BatchState.TEST_SCALE:
                item.el.dataset.scale = item.width / item.el.scrollWidth * 100 + "%";
                item.state = BatchState.TEST_END;
                break;
        }
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
    const el = $("a");
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
        el.style.setProperty("font-size", el.dataset.scale);
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
            if (line.el.isConnected) line.el.remove();
            if (line.el.classList.contains("active")) disableLine(line.el);
            root.append(line.el);
        }
        else renderLine(line, root);
    }
    if (lines.normWidth !== root.offsetWidth) {
        if (lines.normWidth) lines.forEach(line => line.el.replaceChildren(line.text));
        normalizeBatch(lines);
    }
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
        const el = $("button");
        el.style.touchAction = "none";
        el.textContent = text;
        let controller;
        handleHold(el, { 
            t: 500,
            onStart: () => stepInterval([
                [500, Infinity, () => {}],
                [2500, 100],
                [null, 50]
            ], () => changeOffset(num), (controller = new AbortController()).signal),
            onEnd: () => controller.abort(),
            signal
        });
        el.onclick = () => changeOffset(num);
        return el;
    };
    const dec = offsetButton("-", -100);
    const inc = offsetButton("+", 100);
    const offset = $("button");
    offset.className = "offset";
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

function addOverlay(root, onMenu, position="bottom-right") {
    const ov = overlay(root, { inset: "5px" });
    const wrapper = ov.get(position);
    wrapper.style.display = "flex";
    wrapper.style.gap = "5px";
    if (onMenu) {
        let menuOpened = false;
        const slot = $("span");
        slot.style.display = "flex";
        slot.style.gap = "5px";
        const menu = $("button");
        menu.className = "menu-btn";
        menu.textContent = "‹";
        menu.style.fontWeight = "bold";
        menu.onclick = () => {
            onMenu(slot, menuOpened = !menuOpened);
            menu.dataset.open = menuOpened;
            menu.textContent = menuOpened ? "›" : "‹";
            if (menuOpened) menu.insertAdjacentElement("beforebegin", slot);
            else slot.remove();
        }
        wrapper.append(menu);
    }
    return ov;
}

function syncButton() {
    const sync = $("button");
    sync.innerText = "Sync";
    sync.className = "sync";
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
        const spacer = $("div");
        spacer.style.flexGrow = 1;
        root.append(spacer);
        if (!timed) {
            addOverlay(root);
            return;
        }
        const { timeObj, onMenu } = timingMenu(id, signal);
        const overlay = addOverlay(root, onMenu);
        const sync = syncButton();
        sync.onclick = () => {
            root.scrollTo(0, scrollTarget.offsetTop);
            sync.remove();
        }
        let currentLine, scrollTarget = lines[0].el, snapped = true, smoothScrollTop, lockSnapped;
        let pendingScroll;
        const smoothScroll = (top) => {
            cancelAnimationFrame(pendingScroll);
            const scrollTop = root.scrollTop;
            const offset = top - scrollTop;
            const duration = Math.pow(Math.abs(offset), 1/3) * 50;
            let start;
            smoothScrollTop = scrollTop;
            const scroll = () => {
                start ??= performance.now();
                const elapsed = performance.now() - start;
                if (elapsed >= duration) {
                    root.scrollTop = smoothScrollTop = top;
                    return;
                }
                const pos = scrollTop + offset * easeInOut(elapsed / duration);
                root.scrollTop = smoothScrollTop = pos;
                pendingScroll = requestAnimationFrame(scroll)
            };
            pendingScroll = requestAnimationFrame(scroll);
        };
        const select = (el, init) => {
            if (currentLine) disableLine(currentLine);
            enableLine(el);
            currentLine = el;
            scrollTarget = el.previousElementSibling ?? el;
            if (snapped) {
                if (init) root.scrollTop = scrollTarget.offsetTop;
                else smoothScroll(scrollTarget.offsetTop);
            }
            if (scrolledToBottom(root) && withinBottom(el, root)) {
                snapped = true;
                scrollCommit();
            }
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
        const scrollTest = throttle(() => {
            snapped = lockSnapped || Math.abs(root.scrollTop - Math.min(scrollTarget.offsetTop, root.scrollHeight - root.offsetHeight)) < 10
        });
        const scrollCommit = debounce(() => {
            if (snapped) sync.remove();
            else if (!sync.isConnected) overlay.get("top-right").append(sync);
        }); 
        const scrollUpdate = () => {
            if (Math.abs(root.scrollTop - smoothScrollTop) < 1) snapped = true;
            else {
                cancelAnimationFrame(pendingScroll);
                scrollTest();
            }
        };
        root.addEventListener("scroll", scrollUpdate, { signal });
        root.addEventListener("scrollend", () => {
            scrollUpdate();
            scrollCommit();
        }, { signal });
        const update = (init) => {
            if (!audio.src.includes(id)) {
                if (currentLine) disableLine(currentLine);
                currentLine = null;
                return;
            }
            for (let i = lines.length - 1; i >= 0; i--) {
                const { time, el } = lines[i];
                if (time !== undefined && audio.currentTime + .001 >= time + getOffset(timeObj)) {
                    if (currentLine !== el) {
                        select(el, init);
                        if (!snapped) {
                            scrollUpdate();
                            scrollCommit();
                        }
                    }
                    return;
                }
            }
            if (currentLine) {
                disableLine(currentLine);
                currentLine = null;
                scrollTarget = lines[0].el;
                if (snapped) smoothScroll(0);
            }
        };
        audio.addEventListener("timeupdate", () => update(), { signal });
        const normalize = throttle(() => {
            lines.forEach(line => line.el.replaceChildren(line.text));
            normalizeBatch(lines);
            lines.normWidth = root.offsetWidth;
            root.scrollTop = scrollTarget.offsetTop;
            scrollUpdate();
            scrollCommit();
        });
        let prevHeight = root.offsetHeight;
        const unlock = debounce(() => lockSnapped = false);
        observer = new ResizeObserver(() => {
            if (lines.normWidth === root.offsetWidth) {
                const height = root.offsetHeight; 
                if (height < prevHeight) {
                    if (snapped) {
                        cancelAnimationFrame(pendingScroll);
                        lockSnapped = true;
                        unlock();
                        root.scrollTop = scrollTarget.offsetTop;
                    } if (root.scrollHeight - root.scrollTop - prevHeight < prevHeight - height) {
                        const top = root.scrollTop + prevHeight - height;
                        root.scrollTop = top;
                        smoothScrollTop = top;
                    }
                } else {
                    scrollUpdate();
                    scrollCommit();
                }
                prevHeight = root.offsetHeight;
            } else normalize();
        });
        observer.observe(root);
        update(true);
    } catch {
        status?.disable();
        root.remove();
    }
}
