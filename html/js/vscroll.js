import $, { debounce } from "./l.js";
export function virtualScroll(root, list, render=x=>x) {
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
    let height, viewSize, size, index, dataIndex, indexMap = new Map();
    const nodes = (size, start=0) => list.slice(start, start + size).map(render);
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
    const update = () => {
        indexMap.clear();
        list.forEach((node, i) => indexMap.set(parseInt(node.dataset.index), i));
        let scrollTarget;
        if (list.length) {
            const testEl = render(list[0]);
            container.append(testEl);
            if (height) scrollTarget = root.scrollTop / height;
            const margin = parseInt(getComputedStyle(testEl).marginBottom);
            height = testEl.getBoundingClientRect().height + margin;
            testEl.remove();
            viewSize = Math.ceil(root.clientHeight / height);
            size = viewSize * 3;
        }
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
        const top = Math.max(Math.min(position - viewSize, list.length - size), 0);
        if (top - index === 0 && !force) return;
        container.style.transform = `translateY(${height * top}px)`;
        container.replaceChildren(...nodes(size, top));
        index = top;
        dataIndex = parseInt(list[position]?.dataset.index) || 0;
    };
    const observer = new ResizeObserver(() => {
        viewSize = Math.ceil(root.clientHeight / height);
        size = viewSize * 3;
        callback(true);
    });
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
    const listen = () => root.addEventListener("scroll", listener, { passive: true });
    listen();
    const dispose = () => observer.disconnect() || root.removeEventListener("scroll", listener);
    root.scrollToEl = (el) => {
        root.removeEventListener("scroll", listener);
        const index = indexMap.get(parseInt(el.dataset.index));
        root.scrollTop = index * height + 1;
        callback();
        list[index]?.focus();
        listen();
    }
    return { update, dispose };
}
