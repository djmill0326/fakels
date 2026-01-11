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
        timeout = setTimeout(() => {
            f.apply(this, args);
        }, t);
    };
    return debounced;
}

export function throttleDelayed(f, t=50) {
    let timeout;
    let latestArgs;
    function debounced(...args) {
        latestArgs = args;
        if (!timeout) timeout = setTimeout(() => {
            f.apply(this, latestArgs);
            timeout = null;
        }, t);
    };
    return debounced;
}

export function throttle(f, t=50) {
    let timeout;
    let prevTime;
    let savedArgs;
    function throttled(...args) {
        const time = performance.now();
        const diff = time - prevTime; 
        savedArgs = args;
        if (prevTime != null && diff < t) {
            if(!timeout) timeout = setTimeout(() => {
                throttled(...savedArgs);
                timeout = null;
            }, t - diff);
            return;
        };
        clearTimeout(timeout);
        timeout = null;
        f(...args);
        prevTime = time;
        savedArgs = null;
    }
    return throttled;
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

export function handleHold(el, onHold, t=500, needsRelease=false) {
    let timeout, onMove, interceptClick;
    const cancel = () => {
        clearTimeout(timeout);
        el.removeEventListener("pointermove", onMove);
        setTimeout(() => window.removeEventListener("click", interceptClick, true), 0);
    };
    el.addEventListener("pointerdown", ev => {
        if (!ev.isPrimary || ev.button !== 0) return cancel();
        el.releasePointerCapture(ev.pointerId);
        timeout = setTimeout(() => {
            timeout = null;
            if (!needsRelease) onHold(ev);
        }, t);
        const x = ev.x;
        const y = ev.y;
        onMove = ev => {
            if (ev.isPrimary && (Math.abs(ev.x - x) > 20 || Math.abs(ev.y - y) > 20)) cancel();
        }
        el.addEventListener("pointermove", onMove);
        interceptClick = ev => {
            if (!timeout && (ev.target === el || el.contains(ev.target))) {
                ev.stopImmediatePropagation();
                ev.preventDefault();
                interceptClick = null;
            }
        };
        window.addEventListener("click", interceptClick, true);
    });
    el.addEventListener("pointerup", ev => {
        if (!ev.isPrimary) return;
        if (timeout) return cancel();
        if (needsRelease) onHold(ev);
        cancel();
    });
    el.addEventListener("pointerleave", cancel);
    el.addEventListener("pointercancel", cancel);
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

export const pathname = (link) => {
    const i = link.lastIndexOf("/");
    return i === -1 ? link : link.slice(i + 1);
};

export const anchor_from_link = (link, list) => {
    if (!link) return;
    const name = pathname(link);
    return list.find(node => node.firstElementChild.href.endsWith(name))?.firstElementChild;
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

export const cover_src = (el, isMedia=true) => `${location.origin}/covers/${el.dataset.cover ? getSemanticPath(el.href, el.dataset) : "default"}/${isMedia ? "cover" : "folder"}.jpg`;

const event_bus = window.event_bus ??= new EventTarget();
export const Bus = {
    dispatch(type, data) {
        if(window.BUS_DEBUG) console.debug("[Bus]", type, data);
        event_bus.dispatchEvent(new CustomEvent(type, { detail: data }));
    },
    on(type, cb, init) {
        const callback = ev => cb(ev.detail, ev);
        event_bus.addEventListener(type, callback, init);
        return callback;
    },
    off(type, cb) {
        event_bus.removeEventListener(type, cb);
    },
    call: {
        dispatch(type, data) {
            Bus.dispatch(`call-${type}`, data);
        },
        on(type, cb, init) {
            return Bus.on(`call-${type}`, cb, init);
        },
        off(type, cb) {
            Bus.off(`call-${type}`, cb);
        }
    }
};
