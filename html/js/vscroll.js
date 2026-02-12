import $ from "./l.js";
export function virtualScroll(root, list, modes) {
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
    let height, viewSize, size, gutter, index, dataIndex, indexMap = new Map(), currentMode, pool = [];
    const nearest = (index, distance=10) => {
        const self = indexMap.get(index);
        if (self) return self;
        for (let i = 1; i <= distance; i++) {
            const a = indexMap.get(index - i);
            if (a) return a;
            const b = indexMap.get(index + i);
            if (b) return b;
        }
        return 0;
    }
    const update = (mode, resizeOnly=false) => {
        if (!resizeOnly) {
            indexMap.clear();
            list.forEach((node, i) => indexMap.set(parseInt(node.dataset.index), i));
        }
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
            viewSize = Math.ceil(root.clientHeight / height);
            gutter = 2 * viewSize;
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
        if (scrollTarget) {
            const position = Math.floor(scrollTarget);
            const difference = scrollTarget - position;
            const index = nearest(dataIndex);
            root.scrollTop = (index + difference) * height;
        }
        root.removeEventListener("scroll", listener);
        callback(true);
        listen();
    }
    const callback = (force=false) => {
        const position = Math.floor(root.scrollTop / height);
        const top = Math.max(Math.min(position - gutter, list.length - size), 0);
        const diff = Math.abs(top - index);
        dataIndex = parseInt(list[position]?.dataset.index) || 0;
        const overflowTop = position - gutter;
        const overflowBottom = list.length - position - gutter;
        const overflow = overflowTop < 0 || overflowBottom < 0;
        if (!(((overflow && diff) || diff >= gutter * .5) || force)) return;
        container.style.transform = `translateY(${height * top}px)`;
        if (!currentMode) return;
        const updateShell = modes[currentMode].update;
        pool.forEach((el, i) => {
            const listIndex = top + i;
            if (listIndex < list.length) {
                el.style.display = "";
                updateShell(el, list[top + i]);
            } else el.style.display = "none";
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
    const dispose = () => observer.disconnect() || root.removeEventListener("scroll", listener);
    root.scrollToEl = (el) => {
        root.removeEventListener("scroll", listener);
        const i = indexMap.get(parseInt(el.dataset.index));
        root.scrollTop = i * height + 1;
        callback();
        list[i - index]?.focus();
        listen();
    }
    return { update, dispose };
}
