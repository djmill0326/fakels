export const _ = localStorage;

export default function(tag) {
    return document.createElement(tag);
}

export function id(tag) {
    return document.getElementById(tag);
}

export function debounce(f, t=50) {
    let timeout;
    function debounced(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(f.bind(this, ...args), t);
    };
    return debounced;
}

export function boundedCache(limit) {
    const cache = new Map();
    const list = [];
    const cacheClear = cache.clear.bind(cache);
    const cacheDelete = cache.delete.bind(cache);
    const cacheSet = cache.set.bind(cache);
    const cacheGet = cache.get.bind(cache);
    const updatePosition = (key) => {
        if (list.at(-1) === key) return;
        const index = list.findIndex(k => key === k);
        list.splice(index, 1);
        list.push(key);
    };
    cache.clear = () => {
        list.length = 0;
        cacheClear();
    };
    cache.delete = (key) => {
        const index = list.findIndex(k => key === k);
        if (index === -1) return false;
        list.splice(index, 1);
        return cacheDelete(key);
    };
    cache.set = (key, value) => {
        if (cache.has(key)) {
            updatePosition(key);
            return cacheSet(key, value);
        }
        if (list.length === limit) {
            const k = list.shift();
            cacheDelete(k);
        }
        list.push(key);
        return cacheSet(key, value);
    };
    cache.get = (key) => {
        if (!cache.has(key)) return;
        updatePosition(key);
        return cacheGet(key);
    };
    return cache;
}

HTMLElement.prototype.c = HTMLElement.prototype.getElementsByClassName;
HTMLElement.prototype.q = HTMLElement.prototype.querySelector;
HTMLElement.prototype.qa = HTMLElement.prototype.querySelectorAll;
HTMLElement.prototype.scrollToEl = function(el, focus=true) {
    // demented special-case logic to handle different list styles
    const m = getComputedStyle(el).margin;
    const i = m?.indexOf("px");
    if (i && i !== -1) this.scrollTop = el.offsetTop + 1 - m.slice(0, i);
    else this.scrollTop = el.offsetTop;
    if (focus) el.focus();
};

export function handleHold(el, onHold, onClick, t=500, needsPress=false) {
    let downTime = 0;
    let triggered = false;
    let timeout;
    el.addEventListener("pointerdown", ev => {
        ev.preventDefault();
        el.style.userSelect = "none";
        downTime = performance.now();
        if(!needsPress) timeout = setTimeout(() => {
            onHold(ev);
            triggered = true;
        }, t);
    });
    el.addEventListener("pointerup", ev => {
        ev.preventDefault()
        clearTimeout(timeout);
        const time = performance.now();
        if (needsPress) {
            if (time - downTime >= t) onHold(ev);
            else onClick?.(ev);
        } else if (!triggered) onClick?.(ev);
        triggered = false;
    });
}

export function boundBox(el, gutter, minW, maxW, minH, maxH) {
    if(minW) el.style.minWidth  = `min(100% - ${gutter}, ${minW})`;
    if(maxW) el.style.maxWidth  = `min(100% - ${gutter}, ${maxW})`;
    if(minH) el.style.minHeight = `min(100% - ${gutter}, ${minH})`;
    if(maxH) el.style.maxHeight = `min(100% - ${gutter}, ${maxH})`;
}

export function join(...x) {
    const path = x.join("/").replace(/[—\\\/]+/g, "/");
    const tok = path.indexOf(":/") + 2;
    const out = path[0] === "/" ? ["/"] : [];
    let last = 0;
    let dots = 0;
    if (tok !== 1) {
        out.push(path.slice(0, tok));
        last = tok;
    }
    for (let i = 0; i < path.length; i++) {
        const c = path[i];
        if (c === "/") {
            if (dots === 0) out.push(path.slice(last, i));
            else if (dots === 2) out.pop();
            last = i;
            dots = 0;
        } else if (c === "." && (dots === 1 || path[i - 1] === "/")) ++dots;
    }
    if (last !== path.length - 1) out.push(path.slice(last, path.length));
    return out.join("");
}

const numberedNames = (...names) => names.flatMap(name => new Array(9).fill().map((_, i) => `${name}${i + 1}`));
const reservedNames = new Set(["CON", "PRN", "AUX", "NUL", ...numberedNames("COM", "LPT")]);
const sanitizePath = (name) => {
    const trimmed = name.replace(/(^[\.\s]+|[\.\s]+$)/g, "");
    if(reservedNames.has(trimmed.toUpperCase())) return `_${name}`;
    return trimmed.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
}

export function getSemanticPath(path, { artist, album, title }) {
    artist = sanitizePath(artist.replace(/\s+\(?feat\..+/i, ""));
    album = sanitizePath(album);
    return [artist || "Unknown Artist", ...(album ? [album] : ["Unknown Album", sanitizePath(title) || sanitizePath(path.slice(path.lastIndexOf("/" + 1), path.lastIndexOf("."))) || "Unknown Title"])].join("/");
}

export const anchor_from_link = (link, frame) => {
    return link ? frame.querySelector(`[href$="${new URL(link).pathname}"]`) : void 0;
}

export const style = {
    Centered: `
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
        display: flex;
        flex-direction: column;
    `
};
