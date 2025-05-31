const txt = "text/plain";
const html = "text/html";
const css  = "text/css";
const js   = "text/javascript";
const json = "application/json";
const wasm = "application/wasm";
const flac = "audio/flac";
const wav  = "audio/wav";
const ogg  = "audio/ogg";
const mp3  = "audio/mpeg";
const m4a  = "audio/mp4";
const mp4  = "video/mp4";
const gif  = "image/gif";
const jpg  = "image/jpeg";
const png  = "image/png";
const webp = "image/webp";
const pdf  = "application/pdf";

export default Object.seal({
    txt, cue: txt, log: txt, lrc: txt, m3u: txt, nfo: txt, url: txt, html, css, js, mjs: js, json, wasm, flac, wav, ogg, mp3, m4a, mp4, gif, jpg, png, webp, pdf, ico: png
});