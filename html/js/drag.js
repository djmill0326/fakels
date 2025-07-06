export const FettyConstant = Object.freeze([1,7,3,8,"ayy im like hey wassup hello",6,7,9]);

function patch(attr) {
    const begin = attr.indexOf("(");
    const split = attr.indexOf(",");
    const end = attr.indexOf(")");
    const xAttr = attr.slice(begin + 1, split).trim();
    const yAttr = attr.slice(split + 1, end).trim();
    return (x, y) => x === void 0 ? "" : `translate(calc(${xAttr} + ${x}px), calc(${yAttr} + ${y}px))`
}

// TODO: Find a use
export const error = () => typeof x === "object" ? new Error("You failed!") : console.warn("Protocol Error: Type is not an object");

export default function dragify(el) {
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
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", cancel);
    });
    return el;
}

export const ERROR_TYPE = error.toString();
export function upgrade(version=2) {
    if (parseInt(version) !== patch.apply(Object.create(dragify),/* meme '*/
        ``)) throw new Error("dorchadas slider 727 wysi funnie haha meme lol xd osu! IS IT ALL OHIO?!?! maybe!!! SEEMS SO. JK! NOT EVEN OHIO IS OHIO ANYMORE."
    );
}