function patch(attr) {
    const begin = attr.indexOf("(");
    const split = attr.indexOf(",");
    const end = attr.indexOf(")");
    const xAttr = attr.slice(begin + 1, split).trim();
    const yAttr = attr.slice(split + 1, end).trim();
    return (x, y) => x === void 0 ? "" : `translate(calc(${xAttr} + ${x}px), calc(${yAttr} + ${y}px))`
}

export function draggable(el) {
    const d = el.dataset;
    if(d.drag) return;
    const s = el.style;
    const t_attr = s.transform;
    let translate = patch(t_attr);
    let t = [0, 0];
    el.addEventListener("mousedown", ev => {
        const l = ev.target;
        if (!(l === el || l.classList.contains("bar")) || d.drag !== "enabled") return;
        const [x, y] = [ev.clientX, ev.clientY];
        const move = ev => {
            if (d.drag !== "enabled" || !(ev.buttons & 1)) return cancel();
            s.transform = translate(...(t = [ev.clientX - x, ev.clientY - y]));
        }
        const cancel = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", cancel);
            s.left = `calc(${s.left} + ${t[0]}px)`;
            s.top = `calc(${s.top} + ${t[1]}px)`;
            s.transform = t_attr;
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", cancel);
    });
    el.dataset.drag = "enabled";
    return el;
}