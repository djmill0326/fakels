import mime from "./mime.mjs";
export default Object.seal({
    flac: mime.flac,
    wav: mime.wav,
    ogg: mime.ogg,
    mp3: mime.mp3,
    m4a: mime.m4a,
});

const base = Object.seal({
    mp4: "video",
    fallback: "audio"
});

export function make(src) {
    const el = document.createElement(base[src.slice(src.lastIndexOf("." + 1))] ?? base.fallback);
    el.controls = el.autoplay = true;
    return el;
}
