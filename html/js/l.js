export const _ = localStorage;

export default function $(tag) {
    return document.createElement(tag);
}

export function id(tag) {
    return document.getElementById(tag);
}

export function staticQuery(el, map) {
    el.sq ??= {};
    for (const name in map) {
        const v = map[name];
        el.sq[name] = typeof v === "string" ? el.q(map[name]) : v(el);
    }
    return el;
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
    const cacheSet = cache.set.bind(cache);
    const cacheGet = cache.get.bind(cache);
    const updatePosition = (key) => {
        const v = cacheGet(key);
        cache.delete(key);
        cacheSet(key, v);
        return v;
    };
    cache.set = (key, value) => {
        if (cache.has(key)) {
            updatePosition(key);
            return cacheSet(key, value);
        }
        if (cache.size === limit)
            cache.delete(cache.keys().next().value);
        return cacheSet(key, value);
    };
    cache.get = (key) => {
        if (!cache.has(key)) return;
        return updatePosition(key);
    };
    return cache;
}

HTMLElement.prototype.c = HTMLElement.prototype.getElementsByClassName;
HTMLElement.prototype.q = HTMLElement.prototype.querySelector;
HTMLElement.prototype.qa = HTMLElement.prototype.querySelectorAll;

export function handleHold(el, options) {
    const { t=300, needsRelease=false, onStart, onEnd, onHold, signal } = typeof options === "function" ? { onHold: options } : options;
    let timeout, onMove, interceptClick, canceled;
    const cancel = () => {
        if (canceled) return;
        canceled = true;
        onEnd?.();
        clearTimeout(timeout);
        el.removeEventListener("pointermove", onMove);
        setTimeout(() => window.removeEventListener("click", interceptClick, true), 0);
    };
    el.addEventListener("pointerdown", ev => {
        if (!ev.isPrimary || ev.button !== 0) return cancel();
        canceled = false;
        onStart?.();
        timeout = setTimeout(() => {
            timeout = null;
            if (!needsRelease) onHold?.(ev);
        }, t);
        const x = ev.x;
        const y = ev.y;
        onMove = ev => {
            if (ev.isPrimary && (Math.abs(ev.x - x) > 20 || Math.abs(ev.y - y) > 20)) cancel();
        }
        el.addEventListener("pointermove", onMove, { signal });
        interceptClick = ev => {
            if (!timeout && (ev.target === el || el.contains(ev.target))) {
                ev.stopImmediatePropagation();
                ev.preventDefault();
                interceptClick = null;
            }
        };
        document.body.addEventListener("click", interceptClick, { once: true, capture: true, signal });
    });
    el.addEventListener("pointerup", ev => {
        if (!ev.isPrimary) return;
        if (timeout) return cancel();
        if (needsRelease) onHold?.(ev);
        cancel();
    }, { signal });
    el.addEventListener("pointerleave", cancel, { signal });
    signal?.addEventListener("abort", () => clearTimeout(timeout));
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
    const out = [];
    let last = 0;
    let dots = 0;
    if (tok !== 1) {
        out.push(path.slice(0, tok));
        last = tok;
    }
    for (let i = 0; i < path.length; i++) {
        const c = path[i];
        if (c === "/") {
            if (dots === 0) out.push(path.slice(last, i + 1));
            else if (dots === 2) out.pop();
            last = i + 1;
            dots = 0;
        } else if (c === "." && (dots === 1 || path[i - 1] === "/")) ++dots;
    }
    if (last !== path.length - 1) out.push(path.slice(last, path.length));
    return out.join("");
}

const numberedNames = (...names) => names.flatMap(name => new Array(9).fill().map((_, i) => `${name}${i + 1}`));
const reservedNames = new Set(["CON", "PRN", "AUX", "NUL", ...numberedNames("COM", "LPT")]);
const sanitizePath = (name, skip=false) => {
    if (!name) return "";
    const trimmed = name.replace(/(^[\.\s]+|[\.\s]+$)/g, "");
    if (skip) return trimmed;
    if(reservedNames.has(trimmed.toUpperCase())) return `_${name}`;
    return trimmed.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
}

export const tag_shorthand = {
    a: "artist",
    A: "album",
    y: "year"
};

export const tag_normalizers = {
    artist: x => x?.replace(/\s+\(?feat\..+/i, "") || "Unknown Artist",
    album: x => x || "Unknown Album",
    year: x => {
        if (!x || x < 1500 || x > 2500) return "Unknown Year";
        if (x < 1960) return "Pre-60s";
        x = Math.floor(x / 10) * 10;
        let n = x; 
        if (n < 2000) n -= 1900;
        return `${n}s (${x}-${x + 9})`;
    }
};

const strip_the = x => {
    if (x.length < 5) return x;
    if ((x[0] === "t" || x[0] === "T") &&
        (x[1] === "h" || x[1] === "H") &&
        (x[2] === "e" || x[2] === "E") &&
         x[3] === " "
    ) return x.slice(4);
    return x;
};

const lex_year = x => {
    if (x === "Unknown Year") return Infinity;
    const n = parseInt(x);
    return isNaN(n) ? 0 : n;
};

const compare = new Intl.Collator().compare;
export const tag_sorters = {
    default: (a, b) => compare(strip_the(a.name), strip_the(b.name)),
    year: (a, b) => lex_year(a.name) - lex_year(b.name)
};

export function getSemanticPath({ name, artist, album, title }, sanitize=true) {
    const s = !sanitize;
    artist = sanitizePath(tag_normalizers.artist(artist), s);
    album = sanitizePath(album, s);
    return [artist, ...(album ? [album] : ["Unknown Album", sanitizePath(title, s) || sanitizePath(name.slice(0, name.lastIndexOf(".")), s) || "Unknown Title"])].join("/");
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

export const overlay = (root, opt={}) => {
    if (root._overlay) return root._overlay;
    root.style.position ||= "relative";
    const o = {
        inset: opt.inset ?? 0,
        sticky: opt.sticky ?? true,
        overlays: {},
        add(position, ...children) {
            const existing = o.overlays[position];
            if (existing) {
                existing.append(...children);
                return this;
            }
            const [vert, horiz] = position.split("-");
            if (o.sticky && !o.overlays[vert]) {
                const wrapper = $("div");
                wrapper.style = `
                    position: sticky;
                    pointer-events: none;
                    max-height: 0;
                    ${vert}: ${o.inset};
                `;
                wrapper.className = `overlay ${vert}`;
                root[`${vert === "top" ? "pre" : "ap"}pend`](wrapper);
                o.overlays[vert] = wrapper; 
            }
            const el = $("div");
            el.style.position = "absolute";
            el.style.pointerEvents = "all";
            el.style[horiz] = o.inset;
            el.className = position;
            el.append(...children);
            if (o.sticky) {
                el.style[vert] = 0;
                o.overlays[vert].append(el);
            } else {
                el.style[vert] = o.inset;
                root.append(el);
            }
            o.overlays[position] = el;
            return this;
        },
        get(position) {
            const existing = o.overlays[position];
            if (existing) return existing;
            else {
                o.add(position);
                return o.overlays[position];
            }
        },
        remove(position) {
            const existing = o.overlays[position];
            if (!existing) return;
            existing.remove();
            delete o.overlays[position];
        }
    };
    root._overlay = o;
    return o;
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

export const display_mode = () => _.mode === "repeat" ? "Repeat one" : `Shuffle ${_.mode === "shuffle" ? "on" : "off"}`;

export const cover_src = (item, isMedia=true) => `${location.origin}/covers/${isMedia ? `${getSemanticPath(item)}/cover` : "default/folder"}.jpg`;

const event_bus = window.event_bus ??= new EventTarget();
export const Bus = {
    dispatch(type, data) {
        if(window.BUS_DEBUG >= 1 || window.BUS_DEBUG?.has?.(type) || window.BUS_DEBUG?.find?.(t => t === type)) console.debug("[Bus]", type, data);
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

export const sleep = (t) => new Promise(resolve => setTimeout(resolve, t));

export const stepInterval = async (sequence, cb, signal) => {
    let start = performance.now();
    for (let i = 0; i < sequence.length; i++) {
        const [t, int, c] = sequence[i];
        const end = t == null ? Infinity : start + t;
        let nextTick = start + (sequence[i - 1]?.[0] ?? 0);
        while (performance.now() < end) {
            (c || cb)();
            nextTick += int;
            const delay = nextTick - performance.now();
            if (delay > 0) await sleep(delay);
            if (signal?.aborted) return;
        }
        if (signal?.aborted) return;
    }
};

export const scrolledToBottom = (el, tolerance=1) => el.scrollHeight - el.scrollTop - el.offsetHeight < tolerance;
export const withinBottom = (el, root, tolerance=1) => el.offsetTop > root.scrollHeight - root.clientHeight - tolerance;

export const easeInOut = x => x < .5 
    ? .5 * Math.pow(2 * x, 2)
    : -.5 * Math.pow(2 * x - 2, 2) + 1;
