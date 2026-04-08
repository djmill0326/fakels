import $ from "./l.js";
import { scrollable } from "./scrollbar.js";
export function virtualScroll(root, modes, list, backing, { anchors, focusable=x=>x }) {
    root.replaceChildren();
    root.style.position = "relative";
    const wrapper = $("div");
    wrapper.className = "vscroll";
    const container = $("div");
    container.style.willChange = "transform";
    container.style.position = "absolute";
    container.style.width = "100%";
    wrapper.append(container);
    root.append(wrapper);
    const scrollController = new AbortController();
    let height, viewSize, size, gutter, latestHeight, index, dataIndex, currentMode, pool = [];
    const lookup = (index) => backing[index]?.activeIndex;
    const nearest = (index, distance=500) => {
        const self = lookup(index);
        if (self != null) return self;
        for (let i = 1; i <= distance; i++) {
            const a = lookup(index - i);
            if (a != null) return a;
            const b = lookup(index + i);
            if (b != null) return b;
        }
        return 0;
    }
    const update = (mode, resizeOnly=false) => {
        let scrollTarget;
        if (list.length) {
            const { shell, update } = modes[mode];
            if (!resizeOnly) {
                const testEl = shell();
                update(testEl, list[0]);
                container.append(testEl);
                if (height) scrollTarget = root.scrollTop / height;
                const margin = parseInt(getComputedStyle(testEl).marginBottom);
                height = testEl.getBoundingClientRect().height + margin;
                testEl.remove();
            }
            if (!height) return;
            viewSize = Math.ceil(root.offsetHeight / height);
            gutter = viewSize * 4;
            size = viewSize + 2 * gutter;
            if (mode !== currentMode) for (let i = 0; i < pool.length; i++) {
                const el = shell();
                pool[i].replaceWith(el);
                pool[i] = el;
            }
            if (size > pool.length) for (let i = pool.length; i < size; i++) {
                pool[i] = shell();
                container.append(pool[i]);
            } else pool.splice(size).forEach(el => el.remove());
        } else pool.splice(0).forEach(el => el.remove());
        currentMode = mode;
        const scrollHeight = height * list.length;
        wrapper.style.height = scrollHeight + "px";
        if (scrollTarget != null) {
            const position = Math.floor(scrollTarget);
            const difference = scrollTarget - position;
            const index = nearest(dataIndex);
            root.scrollTop = (index + difference) * height;
        }
        root.removeEventListener("scroll", listener);
        callback(true);
        listen();
        root.forceScrollbarUpdate();
    }
    const callback = (force=false) => {
        const position = Math.floor(root.scrollTop / height);
        const top = Math.max(Math.min(position - gutter, list.length - size), 0);
        const diff = top - index;
        const dist = Math.abs(diff);
        dataIndex = list[position]?.id || 0;
        const overflowTop = position - gutter;
        const overflowBottom = list.length - position - gutter;
        const overflow = overflowTop < 0 || overflowBottom < 0;
        if (!(((overflow && dist) || dist >= gutter * .5) || force)) return;
        container.style.transform = `translateY(${Math.round(height * top)}px)`;
        if (!currentMode) return;
        const updateShell = modes[currentMode].update;
        let shifted, begin = 0;
        if (!force && dist < size) {
            if (diff < 0) {
                shifted = pool.splice(size - dist);
                pool.unshift(...shifted);
                container.prepend(...shifted);
                
            } else {
                begin = size - dist;
                shifted = pool.splice(0, dist);
                pool.push(...shifted);
                container.append(...shifted);
            }
        }
        pool.forEach((el, i) => {
            const listIndex = top + i;
            if (listIndex < list.length) {
                if (el._hidden) {
                    el.style.display = "";
                    el._hidden = false;
                }
                if (!shifted || (i >= begin && i - begin < shifted.length)) updateShell(el, list[listIndex]);
            } else if (!el._hidden) {
                el.style.display = "none";
                el._hidden = true;
            }
        });
        index = top;
    };
    const observer = new ResizeObserver(() => currentMode && update(currentMode, true));
    observer.observe(root);
    let ticking = false;
    const listener = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            callback();
            ticking = false;
        })
    }
    const listen = () => root.addEventListener("scroll", listener);
    listen();
    const dispose = () => observer.disconnect() || scrollController.abort() || root.removeEventListener("scroll", listener);
    const watchResize = target => {
        observer.disconnect();
        observer.observe(target ?? root);
    };
    let activeIndex = 0, offsetDistance;
    const focus = (item, autoBlur=true) => {
        const i = item.activeIndex ?? lookup(item);
        const el = pool[i - index];
        if (el) {
            const target = focusable(el);
            if (target) {
                target.focus({ preventScroll: true });
                if (autoBlur) target.blur();
                activeIndex = i;
            }
        }
    };
    const scrollTo = (item, autoBlur=true, focusIndex) => {
        const i = item.activeIndex ?? lookup(item);
        if (i == null) return;
        root.removeEventListener("scroll", listener);
        const pos = root.scrollTop = i * height + 1;
        if (!focusIndex) offsetDistance = 0;
        callback();
        listen();
        focus(list[focusIndex ?? i], autoBlur);
    }
    window.addEventListener("keydown", ev => {
        if (!(ev.key === "Tab" && container.contains(document.activeElement))) return;
        const offset = i => Math.max(Math.ceil(i - Math.min(.5 * viewSize - 1, ++offsetDistance)), 0);
        if (ev.shiftKey) {
            if (activeIndex === 0) return activeIndex === -1;
            scrollTo(list[offset(--activeIndex)], false, activeIndex);
        } else {
            if (activeIndex >= list.length - 1) return activeIndex === list.length;
            scrollTo(list[offset(++activeIndex)], false, activeIndex);
        }
        ev.preventDefault();
    });
    const head = () => backing[dataIndex];
    const vscroll = { update, dispose, scrollTo, focus, head, watchResize };
    scrollable(root, { signal: scrollController.signal, anchors, vscroll, backing });
    return vscroll;
}
