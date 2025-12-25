import $, { debounce } from "./l.js";
export function virtualScroll(root, backing, render=x=>x) {
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
    const indexMap = new Map();
    const list = Array.from(backing.children).map((node, i) => [node, i]).filter(([node]) => {
        return !(node.style.display === "none" || node.classList.contains("hidden"));
    }).map(([node, i], j) => {
        indexMap.set(i, j);
        return node.cloneNode(true);
    });
    const testEl = render(list[0]);
    container.append(testEl);
    const margin = parseInt(getComputedStyle(testEl).marginBottom);
    const height = testEl.getBoundingClientRect().height + margin;
    const viewSize = Math.ceil(root.clientHeight / height);
    const size = viewSize * 3;
    testEl.remove();
    const scrollHeight = height * list.length;
    wrapper.style.height = scrollHeight + "px";
    const nodes = (size, start=0) => list.slice(start, start + size).map(render);
    container.append(...nodes(size));
    let index = 0;
    const update = () => {
        const position = Math.min(Math.max(Math.floor(root.scrollTop / height - viewSize), 0), list.length - size);
        const difference = Math.abs(position - index);
        if (difference === 0) return;
        if (difference >= size) container.replaceChildren(
            ...nodes(size, position));
        else if (position < index) container.replaceChildren(
            ...nodes(difference, position),
            ...Array.from(container.children).slice(0, size - difference)); 
        else container.replaceChildren(
            ...Array.from(container.children).slice(difference, size),
            ...nodes(difference, index + size));
        index = position;
        container.style.transform = `translateY(${height * position}px)`;
    };
    const listener = update;
    const listen = () => root.addEventListener("scroll", listener, { passive: true });
    listen();
    root.scrollToEl = (el) => {
        root.dispose();
        const index = indexMap.get(parseInt(el.dataset.index));
        root.scrollTop = index * height + 1;
        update();
        list[index].focus();
        listen();

    }
    root.dispose = () => root.removeEventListener("scroll", listener);
}
