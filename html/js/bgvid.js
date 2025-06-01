import template from "./numeric-template.js";
const video = document.createElement("video");
video.autoplay = true;
video.muted = true;
video.loop = true;
video.style = `
    position: absolute;
    z-index: -1;
    left: 0;
    top: 0;
    width: 100svw;
    height: 100svh;
    object-fit: cover;
    opacity: 0;
`;
const map = new Map();
export function lerp_style(s, p, v, t=808) {
    const a = map.get(s);
    if (a) cancelAnimationFrame(a.x);
    const o = { x: null };
    map.set(s, o);
    const { compile, defaults } = template(s[p]);
    const i = parseFloat(defaults[0]);
    defaults.shift();
    if (isNaN(i)) return;
    const b = performance.now();
    const f = () => {
        const n = performance.now();
        if (n > b + t) return map.delete(s) && (s[p] = v);
        const d = n - b;
        const x = d / t;
        s[p] = compile(i * (1 - x) + v * x, ...defaults);
        o.x = requestAnimationFrame(f);
    };
    f();
}
export function enable(src) {
    if (!document.body.contains(video)) document.body.prepend(video);
    const newsrc = src ?? video.src;
    if (!video.src.includes(newsrc)) video.src = newsrc;
    video.play();
    lerp_style(video.style, "opacity", 1/9);
}
export function disable() {
    video.pause();
    lerp_style(video.style, "opacity", 0);
}