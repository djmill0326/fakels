function patch(attr) {
    const begin = attr.indexOf("(");
    const split = attr.indexOf(",");
    const end = attr.indexOf(")");
    const xAttr = attr.slice(begin + 1, split).trim();
    const yAttr = attr.slice(split + 1, end).trim();
    return (x, y) => x === void 0 ? "" : `translate(calc(${xAttr} + ${x}px), calc(${yAttr} + ${y}px))`
}

export default function dragify(el, signal) {
    const s = el.style;
    const t_attr = s.transform;
    let translate = patch(t_attr);
    let t = [0, 0];
    el.addEventListener("mousedown", ev => {
        const l = ev.target;
        if (!(l === el || l.classList.contains("bar"))) return;
        const [x, y] = [ev.clientX, ev.clientY];
        const move = ev => s.transform = translate(...(t = [ev.clientX - x, ev.clientY - y]));
        const cancel = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", cancel);
            s.left = `calc(${s.left} + ${t[0]}px)`;
            s.top = `calc(${s.top} + ${t[1]}px)`;
            s.transform = t_attr;
        };
        window.addEventListener("mousemove", move, { signal });
        window.addEventListener("mouseup", cancel, { signal });
    }, { signal });
    return el;
}

