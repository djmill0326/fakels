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
    let height, viewSize, size, index, indexMap = new Map();
    const nodes = (size, start=0) => list.slice(start, start + size).map(render);
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
        if (scrollTarget) root.scrollTop = scrollTarget * height;
        root.removeEventListener("scroll", listener);
        callback(true);
        listen();
    }
    const callback = (force=false) => {
        const position = Math.max(Math.min(Math.floor(root.scrollTop / height - viewSize), list.length - size), 0);
        if (position - index === 0 && !force) return;
        container.style.transform = `translateY(${height * position}px)`;
        container.replaceChildren(...nodes(size, position));
        index = position;
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
    let prevTime;
    const scrollTest = () => requestAnimationFrame(t => {
        if (!prevTime) {
            prevTime = t;
            return scrollTest();
        }
        const d = t - prevTime;
        prevTime = t;
        root.scrollTop += d / 10;
        scrollTest();
    });
    //scrollTest();
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
