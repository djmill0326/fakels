export const conjunction_junction = new Set(["for", "and", "nor", "but", "or", "yet", "so", "from", "the", "on", "a", "k", "in", "by", "of", "at", "to"]);
import { hookConsole } from "./tab-log.js";
hookConsole("fakels", x => eval(x)); // temporary for mobile
console.info("fakels (Directory Viewer) [v2.6.0]");
const measure = async () => {
    const { bytes } = await performance.measureUserAgentSpecificMemory();
    console.debug("Memory usage:", parseFloat((bytes / 1000000).toFixed(2)), "MB");
    requestIdleCallback(measure);
};
//measure().then();
import { main, api, getheader } from "./hook.js";
import mime from "./mime.mjs";
import types, { make } from "./mediatype.mjs";
import $, { _, id, handleHold, boundBox, join, style, boundedCache, cover_src, display_mode, Bus, tag_sorters, tag_shorthand, tag_normalizers, overlay, staticQuery } from "./l.js";
import { search, useSearch } from "./search.js";
import { parseLyrics, showLyrics } from "./lyrics.js";
import { virtualScroll } from "./vscroll.js";
import createPlayer from "./player.js"
const title = document.title;
const container = id("main");
const form = main();
const { back, term, btn } = form.children;
const portal = id("porthole");
const media = id("media");
const frame = id("frame");
const items = [];
const activeItems = [];
let query = "", np, queued, vscroll, mel;
let browser = {};
const playlist = [], queue = [];
const shortcut_ui = $("ul");
shortcut_ui.style.userSelect = "none";
back.onclick = (ev) => {
    if (ev.shiftKey && np) term.value = np;
    else {
        const s = query.split("/").slice(1, -1);
        if (s.pop()) term.value = s.join("/");
        else return back.checked = !btn.onclick();
    }
    btn.click();
};
(btn.onclick = () => requestAnimationFrame(() => btn.style.color = back.checked ? "#00b6f0" : "#333"))();
handleHold(btn, () => {
    if (query.at(-2) !== "*") {
        term.value = term.value + (term.value.endsWith("/") ? "*" : "/*");
        form.requestSubmit();
    }
});
export const html = text => text
    .replace(/<\/?(\w*)\s?.*>/g, "")
    .replaceAll("-", "<i>-</i>")
    .replaceAll("[i]", "<i>")
    .replaceAll("[/i]", "</i>");
export const get_info = (link = "50x.html") => {
    const i = link.lastIndexOf("/");
    const segment = decodeURI(i === -1 ? link : link.slice(i + 1));
    const dot = segment.lastIndexOf(".");
    if (dot === -1) return { name: segment };
    return { name: segment.slice(0, dot), ext: segment.slice(dot + 1), full: segment };
};
export const describe = info => `${info.name} [${info.ext ? info.ext : "?"}]`;
const next_item = (item, looping=true) => {
    if (!item) return;
    for (let head = item.id, i = 0; i < items.length; i++) {
        const entry = items[++head];
        let next;
        if (!entry) {
            const initial = items[0]; 
            if (looping && initial) {
                next = initial;
                head = 0;
            }
            else return;
        } else next = entry;
        if (next?.isMedia) return next;
    }
};
import shuffler from "./shuffle.js";
const shuffle = window.shuffle = shuffler(activeItems);
const next_track = () => queue[0] ?? (mode === "shuffle" ? shuffle.peek() : mode === "repeat" ? playlist.at(-1) : next_item(queued));
const fade_time = .05;
let fade_controller;
const next_queued = mode => {
    if (fade_controller && mode !== "immediate") return;
    fade_controller?.abort();
    fade_controller = new AbortController();
    const signal = fade_controller.signal;
    const item = resolve(next_track());
    if (!item) return;
    const next = re(make(item.href));
    next.autoplay = false;
    next.preload = "true";
    next.src = item.href;
    next.classList.add("pending");
    mel.insertAdjacentElement("beforebegin", next);
    const volumechange = next.onvolumechange;
    const timeupdate = next.ontimeupdate;
    next.ontimeupdate = null;
    let ended = false, end, volume;
    const wait_for_resume = (f) => mel.addEventListener("play", f, { once: true, signal });
    const fade = () => {
        if (signal.aborted) return;
        const remaining = end - mel.currentTime;
        if (remaining > fade_time) {
            mel.volume = volume;
            next.currentTime = 0;
            next.pause();
            return fade_wait();
        }
        if (ended || remaining <= 0) {
            next.autoplay = true;
            next.volume = volume;
            next.onvolumechange = volumechange;
            next.ontimeupdate = timeupdate;
            mel.onpause = mel.onerror = undefined;
            mel.src = "";
            mel.replaceWith(next);
            next.classList.remove("pending");
            mel = next;
            fade_controller = undefined;
            update_link(item, false);
            Bus.dispatch("play");
            return;
        }
        const scale = Math.pow(remaining / fade_time, 2);
        mel.volume = volume * scale;
        next.volume = volume * (1 - scale);
        if (mel.paused) {
            next.pause();
            return wait_for_resume(fade);
        }
        if (next.paused) next.play();
        setTimeout(fade, 0);
    };
    const fade_wait = () => {
        if (signal.aborted) return;
        if (end - mel.currentTime <= fade_time) {
            mel.onvolumechange = null;
            next.onvolumechange = null;
            volume = mel.volume;
            next.volume = 0;
            next.play();
            fade();
            return;
        }
        if (mel.paused) return wait_for_resume(fade_wait);
        setTimeout(fade_wait, 0);
    };
    next.addEventListener("canplay", () => {
        end = mode === "immediate" ? 0 
            : mode === "now" ? Math.min(mel.currentTime + fade_time, mel.duration) 
            : mel.duration;
        fade_wait();
    }, { once: true, signal });
    mel.onended = () => ended = true;
    signal.addEventListener("abort", () => {
        next.remove();
        if (volume !== undefined) mel.volume = volume;
        fade_controller = undefined;
    });
};
const re = el => {
    let queuing = false;
    el.ontimeupdate = () => {
        _.ltime = el.currentTime;
        Bus.dispatch("time", { progress: el.currentTime || 0, duration: el.duration || 0 });
        if (!queuing && el.duration - el.currentTime < 5) {
            queuing = true;
            next_queued();
        }
    }
    el.onvolumechange = () => _.lvol = el.volume;
    el.onended = () => next_queued("immediate");
    el.onplaying = () => Bus.dispatch("play");
    el.onpause = () => Bus.dispatch("pause");
    el.addEventListener("canplay", () => el.onerror = () => next_queued("immediate"), { once: true });
    return el;
};
let mode = _.mode ??= "loop";
const next_mode = {
    loop: "repeat",
    repeat: "shuffle",
    shuffle: "loop"
}
window.switch_mode = () => {
    mode = _.mode = next_mode[_.mode];
    update_status();
    Bus.dispatch("shuffle-state", mode);
};
Bus.call.on("switch-mode", switch_mode);
Bus.call.on("status", () => {
    Bus.dispatch("shuffle-state", mode);
    if (mel) Bus.dispatch("status", {
        progress: mel.currentTime || 0,
        duration: mel.duration || 0,
        paused: mel.paused
    });
    if (playlist.at(-1)) Bus.dispatch("media", playlist.at(-1));
});
Bus.call.on("prev", () => prev?.onclick());
Bus.call.on("next", () => next?.onclick());
Bus.call.on("play", () => mel?.play());
Bus.call.on("pause", () => mel?.pause());
Bus.call.on("seek", time => mel && (mel.currentTime = time));
let replay_slot = _.lplay?.replace(/10(666|667)/g, await getheader("adapter-port"));
let just_popped = false;
window.onpopstate = (ev) => {
    term.value = ev.state;
    btn.click();
    just_popped = true;
};
const status = $('footer');
const active_requests = new Set();
const toggle_status = () => {
    const is = status.isConnected;
    _.status = !is;
    if (is) status.remove();
    else document.body.append(status);
}
const statbtn = (text, f, cursor) => `<a onclick='${f}()' style='cursor: ${cursor}'>${text}</a>`;
const update_status = () => {
    const segments = [
        _.ldir?.includes("media") ? statbtn(display_mode(), "switch_mode", "pointer") : "",
        shortcut_ui.isConnected ? "" : statbtn("Press '?' for help menu", "toggle_shortcuts", "help"),
        active_requests.size ? `Loading ${Array.from(active_requests).join(", ")}...` :
        items.length ? `Browsing ${_.ldir?.length ? _.ldir : "/"}` : ""
    ]
    status.innerHTML = segments.filter(value => value.length).join(" | ");
}
const status_obj = (name) => ({ 
    name, list: active_requests, update: update_status, 
    enable() { this.list.add(this.name); this.update() },
    disable() { this.list.delete(this.name); this.update() }
});
if(_.status !== "false") document.body.append(status);
const init_item = (item, info) => {
    item.href = join(item.href);
    if (item.isDir == null && item.isMedia == null) {
        info ??= get_info(item.href);
        item.isDir = !info.ext;
        item.isMedia = !!types[info.ext];
    }
    if (item.isDir || item.isMedia) item.cover = cover_src(item, item.isMedia || false);
    if (item.isMedia) item.title ??= extract_title(info);
};
const refill_items = (iter) => {
    if (iter) items.splice(0, items.length, ...iter, ...(virtual_roots[_.ldir] || []));
    const t = performance.now();
    let activeIndex = 0;
    activeItems.splice(0, activeItems.length, ...items.filter((item, i) => {
        const info = get_info(item.href);
        const withinLibrary = types[info.ext] || !mime[info.ext];
        if (!item.id) init_item(item, info);
        item.id = i;
        item.fav = favorites.has(item.href);
        let result = true;
        // hide non-media anchors that aren't folders
        if (library_mode && !withinLibrary) result = false;
        else if (search.term) result = search.check(item);
        if (result) item.activeIndex = activeIndex++;
        else item.activeIndex = null;
        return result;
    }));
    console.debug(`activeItems fill took ${(performance.now() - t).toFixed(2)} ms`);
    update_frame_counts();
    shuffle.invalidate();
    vscroll?.update(library_mode ? "enhanced" : "basic");
    update_status();
};
const enhance_anchor = (el) => {
    el.classList.add("song-card");
    const cover = $("div");
    cover.className = "cover";
    const text = $("div");
    text.className = "info";
    const title = $("div");
    title.className = "title";
    const artist = $("div");
    artist.className = "artist";
    text.append(title, artist);
    el.prepend(cover, text);
};
const basicShell = $("li");
basicShell.append($("a"));
basicShell.firstElementChild.append("");
const enhancedShell = basicShell.cloneNode(true);
enhance_anchor(enhancedShell.firstElementChild);
const vscroll_modes = {
    basic: {
        shell() {
            const el = basicShell.cloneNode(true);
            overlay(el.firstElementChild, { sticky: false });
            return el;
        },
        update(el, item) {
            const a = el.firstElementChild;
            a.href = item.href;
            a.firstChild.data = item.name;
            el.dataset.id = item.id;
            overlay(a).get("bottom-right").innerText = item.fav ? "🌟" : "";
        }
    },
    enhanced: {
        shell() {
            const el = enhancedShell.cloneNode(true);
            overlay(el.firstElementChild, { sticky: false });
            return staticQuery(el, {
                cover: ".cover",
                title: ".title",
                artist: ".artist",
            });
        },
        update(el, item) {
            const a = el.firstElementChild;
            a.href = item.href;
            el.dataset.id = item.id;
            const cover = el.sq.cover;
            const src = item.cover;
            if (cover._src !== src) {
                cover._src = src;
                cover.style.setProperty("--cover-src", `url("${src}")`);
            }
            el.sq.title.innerText = item.isMedia ? item.title : item.name;
            el.sq.artist.innerText = item.isMedia ? (item.artist || "Unknown Artist") : "Folder";
            overlay(a).get("bottom-right").innerText = item.fav ? "🌟" : "";
        }
    }
};
const virtualize = name => {
    vscroll?.dispose();
    const title = $("h3");
    title.innerText = name;
    const list = $("ul");
    vscroll = virtualScroll(list, vscroll_modes, activeItems, items);
    frame.replaceChildren(title, list);
};
const normalize_tag = (value, tag) => tag_normalizers[tag]?.(value) || value;
const sorted = (list, tag) => list.sort(tag_sorters[tag] || tag_sorters.default);
const hierarchicalize = (items, spec) => {
    const root = {};
    for (const item of items) {
        const info = get_info(item.href);
        if (!types[info.ext]) continue;
        spec.reduce((n, tag, i) => n[normalize_tag(item[tag], tag)] ??= (i === spec.length - 1 ? [] : {}), root).push(item);
    }
    return root;
};
const flat = (root) => root.reduce((list, [_, item]) => {
    if (item.href) list.push(item);
    else list.push(...flat(Object.entries(item)));
    return list;
}, []);
let splat_map, last_splat, last_spec, item_cache;
const splat = (path, items) => {
    if (items) item_cache = Array.from(items);
    const [primary, splat_path] = path.split("**");
    const [spec_str, ...paths] = splat_path.split("/");
    let spec = ["artist", "album"];
    if (spec_str.startsWith(":")) spec = spec_str.slice(1).split("").map(x => tag_shorthand[x]);
    if (items || spec_str !== last_spec) splat_map = hierarchicalize(item_cache, spec);
    const is_flat = paths.at(-1) === "*";
    if (is_flat) paths.pop();
    const dir = Object.entries(paths.length ? (paths.reduce((o, k) => o?.[k], splat_map) || []) : splat_map);
    if (is_flat) refill_items(flat(dir));
    else {
        const list = dir.map(([name, item]) => {
            if (item.href) return item;
            return { name, href: `${path}/${name}`, isDir: true };
        }) || [];
        refill_items(paths.length < spec.length ? sorted(list, spec.at(paths.length)) : list);
    }
    last_splat = primary;
    last_spec = spec_str;
};
const unsplat = items => {
    item_cache = items;
    last_spec = last_splat = null;
};
const splat_or_refill = items => _.ldir.includes("**") 
    ? splat(_.ldir, items) 
    : refill_items(items) || unsplat(items);
/*
const found = new Map();
const find_recursive = (root, count, cb) => {
    count ??= { i: 0, expected: 0 };
    ++count.expected;
    api("ls", root, null, ({ files }) => {
        ++count.i;
        for (const item of files) {
            const { name, ext } = get_info(item.href);
            if (!mime[ext]) find_recursive(`${root}${name}${ext ? `.${ext}` : ""}/`, count, cb);
            else found.set(item.href, item);
        }
        if (count.i === count.expected) {
            if (cb) cb(found.values());
            else {
                virtualize("0 entries (flat)");
                splat_or_refill(found.values());
            }
            found.clear();
            on_load();
        }
    }, status_obj(`tree (${root})`), null, false, true);
};
 */
const find_recursive = (root, cb) => {
    api("ls -r", root, null, ({ files }) => {
        if (cb) cb(files);
        else {
            virtualize("0 entries (flat)");
            splat_or_refill(files);
        }
        on_load();
    }, status_obj(`tree (${root})`), null, false, true);
};
const on_load = () => {
    const reset = replay_slot && items.find(item => item.href === replay_slot);
    replay_slot = null;
    if (!reset) return;
    const lplay = _.lplay;
    if (!queued) {
        if (!update_link(reset)) return;
        if (_.ltime &&
            lplay.slice(lplay.lastIndexOf("/") + 1)
            === reset.href.slice(reset.href.lastIndexOf("/") + 1)
        ) mel.currentTime = parseFloat(_.ltime);
    }
};
const virtual_paths = Object.fromEntries(Object.entries({
    "media/Favorites": () => {
        find_recursive("/media/", items => {
            const favs = items.filter(item => favorites.has(item.href));
            virtualize(`Favorites (${favs.length} items)`);
            splat_or_refill(favs);
        });
    },
    "media/Favorites/Missing": () => {
        find_recursive("/media/", items => {
            const missing = new Set(favorites);
            items.forEach(item => {
                if (favorites.has(item.href)) missing.delete(item.href);
            });
            virtualize(`Stale Favorites (${missing.size} items)`);
            splat_or_refill([...missing].map(href => ({
                name: get_info(href).full, href
            })));
        });
    }
}).sort(([a], [b]) => b.length - a.length));
Object.keys(virtual_paths).forEach(console.log);
const virtual_roots = {};
Object.keys(virtual_paths).forEach(path => {
    const i = path.lastIndexOf("/");
    const root = i === -1 ? "" : path.slice(0, i);
    virtual_roots[root] ??= [];
    virtual_roots[root].push({ 
        name: path.slice(i + 1), 
        href: path, 
        virtual: true 
    });
});
const virtual_path = dir => Object.keys(virtual_paths).find(path => dir.startsWith(path));
const clean = x => x.slice(x[0] === "/" ? 1 : 0, x.at(-1) === "/" ? -1 : void 0);
const nav = (t, q) => history.state === t || history.pushState(t, "", location.origin + path_prefix + q.slice(0, -1));
form.onsubmit = (e) => {
    e.preventDefault();
    back.disabled = false;
    if (search.term && term.value.endsWith(search.term)) {
        if (vscroll) {
            const head = vscroll.head();
            if (head) {
                term.blur();
                update_link(head);
                setTimeout(() => vscroll.focus(head), 0);
            }
        }
        return;
    }
    search.reset(true);
    const wildcard = term.value.indexOf("*");
    const dir = term.value.slice(0, wildcard);
    const v = _.ldir = term.value = clean(term.value.replace(/[\/\\]+/g, "/"));
    query = ((v[0] === "/" ? "" : "/") + v + (v.length ? "/" : ""));
    back.checked = query.replace("/", "").length;
    btn.onclick();
    const do_nav = () => {
        if (!just_popped) nav(v, query);
        just_popped = false;
    };
    const virtualPath = virtual_path(v);
    if (wildcard !== -1) {
        if (splat_map && v.startsWith(last_splat + "**")) splat(v);
        else {
            if (virtualPath) virtual_paths[virtualPath]();
            else find_recursive(`/${dir}`);
        }
        return do_nav();
    }
    if (window.rpc && query !== "/link/") window.rpc.socket.emit("rpc", { client: window.rpc.client, event: "browse", data: query });
    console.debug("[fakels/debug]", "query", `'${query}'`);
    unsplat();
    if (virtualPath) {
        virtual_paths[virtualPath]();
        do_nav();
        return;
    }
    api("ls", query, null, data => {
        if (query === "link") return;
        console.log("[fakels/query]", "found", `'${query}'`);
        virtualize(query);
        refill_items(data.files);
        do_nav();
    }, status_obj(`directory ${query}`), null, false, true);
};
Bus.call.on("navigate", link => {
    term.value = link;
    btn.click();
});
term.onkeydown = e => { e.key === "Escape" && term.blur() };
term.oninput = () => term.value === "@" && (term.value = _.ldir);
term.onfocus = () => term.select();
import dragify from "./drag.js";
const popup_savestate = new Map();
let poppedup;
export const popup = window.popup = (el, title, patch=_el=>{}) => {
    if (poppedup) {
        popup_savestate.set(
            poppedup.dataset.title.toLowerCase(), 
            poppedup.style.cssText
        );
        poppedup.remove();
        poppedup._controller.abort();
        poppedup = null;
    }
    if (!el) { update_status(); return; };
    const wrapper = $("div");
    const controller = new AbortController();
    wrapper._controller = controller;
    wrapper.className = "popup";
    wrapper.style = popup_savestate.get(title.toLowerCase()) ?? style.Centered;
    boundBox(wrapper, "2.75em", "450px", "450px", "150px", "900px");
    wrapper.style.setProperty("--width", "450px");
    wrapper.dataset.title = title;
    const bar = $("div");
    bar.style = `
        margin-bottom: 5px;
        display: flex;
    `;
    bar.className = "bar";
    const name = $("span");
    name.innerHTML = html(title);
    name.maxWidth = "";
    name.style.flexGrow = 1;
    const exit = $("button");
    exit.innerText = "✖";
    exit.onclick = () => popup(null);
    bar.append(name, exit);
    el.style.overflowY = "auto";
    wrapper.append(bar, el);
    wrapper.qa("h3").forEach(h => h.style = "margin: 4px 0");
    const link = "url('https://tinyurl.com/yx2wvxyn')";
    const selector = `[style="background: ${link}]`;
    const a = selector + '"]', b = selector + ';"]';
    [...Array.from(wrapper.qa(a)), ...Array.from(wrapper.qa(b)), Array.from(wrapper.c(link))].forEach(b => b.onclick = () => alert("go fuck yourself"));
    document.body.append(dragify(wrapper, controller.signal));
    poppedup = wrapper;
    update_status();
    patch(el);
    return wrapper;
};
const cancel_popup = ev => poppedup && !poppedup.contains(ev.target) && popup(null);
window.addEventListener("mouseup", cancel_popup);
window.addEventListener("keydown", ev => ev.key === "Escape" && cancel_popup(document.body));
const img = (src, iframe=false) => {
    const img = $(iframe ? "iframe" : "img");
    img.src = src;
    img.style.height = "420px";
    if (iframe) {
        img.style.width = "100%";
        img.style.background = "#cccc";
    }
    img.style.borderRadius = "5px";
    const i = src.lastIndexOf("/");
    popup(img, src.substring(i + 1));
};
const lrclib_search = async (item, signal) => {
    let status;
    try {
        let { artist, album, title } = item;
        const params = new URLSearchParams({
            track_name: title,
            ...(album && { album_name: album }),
            ...(artist && { artist_name: artist })
        });
        status = status_obj(`lrclib for ${title}`);
        status.enable();
        const res = await fetch(`http://${location.hostname}:${await getheader("adapter-port")}/lrc?${params}`, { signal });
        const text = await res.text();
        return { title, text };
    } finally { status?.disable() }
};
const lyrics_cache = boundedCache(20);
const get_lyrics = (ref, signal, target) => {
    const src = ref.href ?? ref;
    const id = src.slice(0, src.lastIndexOf("."));
    const cached = lyrics_cache.get(id);
    if (cached) return cached;
    const promise = (async () => {
        let text, title;
        const lrc_src = `${id}.lrc`;
        if (items.find(item => item.href === lrc_src)) {
            const res = await fetch(lrc_src, { signal });
            text = await res.text();
            title = extract_title(get_info(src));
        } else {
            const entry = await lrclib_search(ref, signal);
            if (!entry?.text) throw new Error("lrclib");
            text = entry.text;
            title = entry.title;
        }
        const lines = parseLyrics(text);
        if (target) {
            const root = $("div");
            root.style.opacity = 0;
            target.append(root);
            try {
                showLyrics(id, lines, root, null, { 
                    status: status_obj(`lyrics for '${title}'`),
                    prefetch: true, signal 
                });
            } finally { root.remove() }
        }
        return { lines, title, id };
    })();
    lyrics_cache.set(id, promise);
    promise.catch(() => lyrics_cache.delete(id));
    return promise;
};
let auto_lyrics = _.lyrics === "true";
let lyrics_id = 0;
const lyrics_bus = new EventTarget();
const find_lyrics = async (ref, prefetch) => {
    if (!ref) return;
    const id = lyrics_id++;
    const src = ref.href ?? ref;
    const controller = new AbortController();
    const viewController = new AbortController();
    const playerSignal = player.controller?.signal;
    const signals = (popup) => {
        let ext;
        if (playerSignal) {
            const delayed = new AbortController();
            ext = delayed.signal;
            playerSignal.addEventListener("abort", () => setTimeout(() => delayed.abort(), 200)); // wait for player close
        } else ext = popup._controller.signal;
        return {
            signal: controller.signal,
            viewSignal: AbortSignal.any([viewController.signal, ext])
        };
    };
    const abortOnEvent = (type, controller) => {
        const callback = ({ detail }) => {
            if (detail.src === src && (type === "fetch" || detail.id === id)) return;
            controller.abort();
            lyrics_bus.removeEventListener(type, callback);
        }
        lyrics_bus.addEventListener(type, callback);
    };
    const dispatch = (type) => lyrics_bus.dispatchEvent(new CustomEvent(type, { detail: { src, id }}));
    dispatch("fetch");
    abortOnEvent("fetch", controller);
    abortOnEvent("display", viewController);
    const root = $("div");
    if (player.el || poppedup?.classList.contains("lyrics-popup")) {
        let target = player.el?.q(".container") ?? poppedup;
        const prevLyrics = target.q(".lyrics");
        if (target !== poppedup) {
            root.style.opacity = 0;
            if (prevLyrics) root.style.maxHeight = `${prevLyrics.offsetHeight}px`; 
            else root.style.maxHeight = 0;
        }
        let loading;
        if (!prefetch) {
            loading = $("div");
            loading.className = "lyrics";
            const text = $("div");
            text.className = "lyrics-text loading";
            text.textContent = "Loading lyrics...";
            loading.append(text);
            if (prevLyrics) {
                loading.style.minHeight = `${prevLyrics.offsetHeight}px`;
                prevLyrics.replaceWith(loading);
            } else target.append(loading);
        }
        try {
            const { signal, viewSignal } = signals(target);
            const { title, lines, id } = await get_lyrics(ref, signal, target);
            if (prefetch) return true;
            root.dataset.src = src;
            target.append(root);
            showLyrics(id, lines, root, mel, { signal: viewSignal });
            root.style.maxHeight = "100vh";
            root.style.opacity = 1;
            if (target === poppedup) poppedup.q(".bar span").innerHTML = `Lyrics for <i>${title}</i>`;
            else {
                handleHold(root, { onHold: () => root.classList.add("expanded"), signal: viewSignal });
                root.addEventListener("contextmenu", e => e.preventDefault(), { signal: viewSignal });
                const close = $("button");
                close.textContent = "×";
                close.onclick = (ev) => {
                    root.q(".menu-btn[data-open=true]")?.click();
                    root.classList.remove("expanded");
                    ev.stopPropagation();
                }
                root.q(".overlay").children[0].append(close);
            }
            dispatch("display");
            loading?.remove();
            return true;
        } catch (err) {
            root.remove();
            if (err?.message === "lrclib") {
                const text = loading?.children[0];
                if (!text) return;
                loading.style.minHeight = "";
                text.classList.remove("loading");
                text.textContent = "No lyrics found :("
            }
        }
        return;
    }
    try {
        const { title, lines, id } = await get_lyrics(ref, controller.signal);
        if (prefetch) return true;
        const p = popup(root, `Lyrics for [i]${title}[/i]`);
        const { viewSignal } = signals(p);
        p.classList.add("lyrics-popup", "pending");
        const auto = $("button");
        auto.innerText = "Auto Lyrics";
        if (auto_lyrics) auto.className = "active";
        auto.onclick = () => {
            _.lyrics = auto_lyrics = !auto_lyrics;
            auto.classList[auto_lyrics ? "add" : "remove"]("active");
            if (auto_lyrics && !playlist.at(-1)?.href.includes(id)) find_lyrics(playlist.at(-1)).then((done) => done && find_lyrics(next_track(), true));
        }
        p.q(".bar button").insertAdjacentElement("beforebegin", auto);
        showLyrics(id, lines, root, mel, { status: status_obj(`lyrics for ${title}`), signal: viewSignal });
        p.classList.remove("pending");
        dispatch("display");
        return true;
    } catch { root.remove() }
}
const resolve = (to) => {
    if (!to) return;
    return to.name ? to : items[typeof to === "number"
        ? to
        : parseInt(to.getAttribute?.("data-id"))
    ];
};
const update_link = (to, set_src=true) => {
    const item = resolve(to);
    const link = item.href;
    if (!item) return;
    if (item.isDir) {
        term.value = decodeURI(link);
        btn.click(); return;
    }
    clear_search();
    if(!item.isMedia && set_src) portal.src = link;
    if (item.isMedia || link.includes("/media/")) {
        if (!item.isMedia) {
            if (link.endsWith(".lrc")) {
                find_lyrics(link);
                return;
            }
            return img(link, !link.includes(".jpg"));
        }
        playlist.push(item);
        if (queue.length) queue.shift()
        shuffle.consume(item.activeIndex);
        if (!mel) {
            mel = re(make(link));
            mel.volume = parseFloat(_.lvol ?? 1);
        }
        portal.insertAdjacentElement("afterend", mel);
        portal.remove();
        if (item.href.slice(1).startsWith(encodeURI(_.ldir.slice(0, (_.ldir.lastIndexOf("/*") + 1) || null)))) {
            queued = item;
            vscroll.scrollTo(item.id);
        }
        _.lplay = link;
        if (set_src) {
            fade_controller?.abort();
            mel.src = link;
        }
        np = query;
        const info = get_info(item.href);
        document.title = title;
        console.debug("[fakels/debug]", describe(info));
        console.log("[fakels/media]", `'${title}' has queued.\n`);
        update_media(item, info);
        if (auto_lyrics) {
            find_lyrics(item, !(player.el || poppedup?.classList.contains("lyrics-popup"))).then((done) => done && find_lyrics(next_track(), true));
        }
        Bus.dispatch("media", playlist.at(-1));
    } else if (browser.remove) {
        mel.insertAdjacentElement("beforebegin", portal);
        mel.remove();
        browser.remove();
    }
    return item.isMedia;
};
Bus.call.on("select", data => update_link(data.i));
let pathname = decodeURI(window.location.pathname).slice(1);
const paths = ["dope", "raw", "stylish"];
let path_prefix = "";
for (const path of paths) {
    if (pathname.startsWith(path)) {
        pathname = pathname.slice(path.length + 1);
        path_prefix = "/" + path;
        break;
    }
}
term.value = (pathname.length ? pathname : _.ldir) ?? "";
btn.click();
useSearch(term, refill_items);
const clear_search = () => {
    if (search.term && !search.persistent) {
        term.value = _.ldir;
        search.reset();
    }
};
const dispatch_anchor = (f) => (e) => {
    const target = e.target.href ? e.target.parentElement : e.target;
    if (target?.tagName !== "LI") return;
    e.preventDefault();
    f(target);
};
const frame_handler = dispatch_anchor(update_link);
frame.onclick = frame_handler;
const favorites = new Set(JSON.parse(_.favorites ?? "[]"));
const update_favorites = (k) => {
    const v = !favorites.has(k);
    if (v) favorites.add(k);
    else favorites.delete(k);
    _.favorites = JSON.stringify(Array.from(favorites));
    return v;
};
const update_frame_counts = () => {
    const el = frame.firstElementChild;
    if (!el) return;
    el.innerText = el.innerText
        .replace(/ \(\d+ items\)$/, ` (${activeItems.length} items)`)
        .replace(/\d+ entries \(flat\)$/, `${activeItems.length} entries (flat)`);
};
const toggle_favorite = (el) => {
    const item = resolve(el);
    const a = el.firstElementChild;
    const favorited = update_favorites(item.href);
    item.fav = favorited;
    overlay(a).get("bottom-right").innerText = favorited ? "🌟" : "";
    if (favorited) return;
    const in_favs = _.ldir.startsWith("media/Favorites");
    if (in_favs) items.splice(item.id, 1);
    if (in_favs || (search.term && !search.check(item))) refill_items();
}
handleHold(frame, dispatch_anchor(toggle_favorite));
export const is_bracket = c => c === 40 || c === 42 || c === 91 || c === 93;
export const is_numeric_ascii = s => {
    let b = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (is_bracket(c)) { ++b; continue }
        if (c === 32 || c === 36 || c === 45 || c === 46 || c === 59) continue;
        if (c < 48 || c > 57) return;
    }
    return b % 2 === 0;
};
export const capitalize = text => text.split(".").map((s, i) => s.split(" ").map((word, j) => {
    if ((i + j) && conjunction_junction.has(word)) return word;
    return (word[0] || "").toUpperCase() + word.slice(1);
}).join(" ")).join(".");
export const n = (s="a", c=0) => `${c?"N":"n"}igg${s}`, N = s => n(s, 1);
const ignored = /(\(|\[)(explicit|clean)(\]|\))/gi;
const swaps = {
    usa: "USA",
    Sun_: "Sun?",
    Shit_: "Shit:",
    Don_t: "Don't",
    "One Smart": "Some Smart",
    [n("er")]: n("a"),
    [N("er")]: N("a"),
    "Thought I Knew You": "Knew U",
};
const swap = s => Object.entries(swaps).forEach(([k, v]) => s = s.replace(k, v)) ?? s;
export const extract_title = ({ name }) => {
    return capitalize(name
        .split("-")
        .map(s => swap(s)
            .split(/[_ ]/g)
            .filter(s => !is_numeric_ascii(s))
            .join(" ")
        )
        .filter(s => s.length)
        .join("-")
        .replace(ignored, "")
    );
};
let label_idx = 0;
export const label = (el, text, color="#444") => {
    const label = $("label");
    if (!el.id.length > 0) {
        el.id = "el" + label_idx++;
    }
    label.htmlFor = el.id;
    label.id = "l" + el.id;
    label.textContent = text;
    label.style.color = color;
    return label;
};
export const bundle = (...x) => {
    const el = $("span");
    el.append(...x);
    return el;
};
let player = {};
const open_player = () => {
    player.controller = new AbortController();
    player.el = createPlayer(player.controller.signal);
    container.append(player.el);
    setTimeout(() => player.el.classList.add("open"), 0);
    if (auto_lyrics && playlist.at(-1)) find_lyrics(playlist.at(-1));
};
if (_.player === "true") open_player();
const toggle_player = () => {
    _.player = _.player !== "true";
    if (!player.el) open_player()
    else {
        player.controller.abort();
        player.el.classList.remove("open");
        setTimeout(() => {
            player.el.remove();
            player = {};
        }, 200);
    }
};
Bus.call.on("toggle-player", toggle_player);
const prev = $("button");
const next = $("button");
const mref = $("a");
const init_browser = (item, info) => {
    const player = $("div");
    player.className = "player";
    prev.onclick = () => {
        if (mel.currentTime > 4) return restart_track();
        if (playlist.length === 1) return update_link(playlist[0]);
        const entry = playlist.pop();
        if (mel?.src.endsWith(entry.href)) return prev.onclick();
        update_link(entry);
    };
    next.onclick = () => next_queued(mel.paused ? "immediate" : "now");
    prev.textContent = "↩";
    next.textContent = "↪";
    mref.dataset.src = item.href;
    mref.innerText = document.title = item.title ?? extract_title(info);
    handleHold(mref, toggle_status);
    mref.onclick = toggle_player;
    player.append(
        bundle(prev, label(prev, "prev")),
        bundle(label(mref, "♫", "#00b6f0"), mref),
        bundle(label(next, "next"), next)
    );
    media.append(player);
    browser = {
        update: (item, info) => {
            mref.innerText = item.title;
            mref.dataset.src = item.href;
        },
        remove: () => {
            player.remove();
            browser = {};
            document.title = title;
        }
    };
};
const update_media = (item, info) => {
    if("mediaSession" in navigator) 
        navigator.mediaSession.metadata = new MediaMetadata({ 
            ...item, 
            artwork: [{ src: cover_src(item) }]
        });
    if (browser.update) browser.update(item, info);
    else init_browser(item, info);
};
const restart_track = () => mel && ((mel.currentTime = 0) || mel.play());
let library_mode = _.library === "true";
const toggle_mode = () => {
    _.library = library_mode = !library_mode;
    refill_items();
};
window.toggle_playback = ev => ev?.target === mel ? void 0 : mel.paused ? mel.play() : mel.pause();
window.toggle_shortcuts = () => shortcut_ui.isConnected ? popup(null) : popup(shortcut_ui, "Shortcuts", el => {
    id("shortcut-np").innerHTML = `<i>${html(mel?.isConnected ? mref.innerHTML : "Silence")}</i>`
    if (mel.isConnected) id("shortcut-playback").innerText = mel.paused ? "Resume playback" : "Pause session";
    id("shortcut-shuffle").innerText = display_mode();
});
const term_cmd = (k) => [null, () => term.value.startsWith(k) ? setTimeout(() => term.focus()) : term.focus()]
const shortcuts = {
    "Now-Playing": ["None", restart_track, "np"],
    " ": ["Play/pause", toggle_playback, "playback"],
    ",": ["Previous entry", () => prev.click()],
    ".": ["Next entry", () => next.click()],
    "s": ["Playback mode", switch_mode, "shuffle"],
    "l": ["Find lyrics", () => find_lyrics(playlist.at(-1))],
    "m": ["Toggle library mode", toggle_mode],
    "p": ["Toggle player view", toggle_player],
    "t": ["Toggle status bar", toggle_status],
    "b": ["Go up a directory", () => back.click()],
    "?": ["Bring up this help menu", toggle_shortcuts],
    ":": term_cmd(":"),
    ";": term_cmd(";"),
    "/": [null, () => setTimeout(() => term.focus(), 0)]
};
export const eval_keypress = (ev, s=shortcuts) => {
    if (document.activeElement === term) return;
    const shortcut = s[ev.key];
    if (shortcut) {
        console.debug("[fakels/debug]", "input", `'${ev.key}'`, shortcut[0]);
        shortcut[1](ev);
        return false;
    }
};
window.addEventListener("keypress", eval_keypress);
shortcut_ui.append(...Object.entries(shortcuts).filter(([_, [name]]) => name).map(([key, [name, _, id]]) => {
    const el = $("li");
    el.style.display = "flex";
    el.style.cursor = "pointer";
    el.onclick = () => eval_keypress({ key });
    const label = $("a");
    label.innerText = key.replace(" ", "<Space>");
    label.style.flexShrink = 0;
    const text = $("span");
    text.innerText = name;
    text.id = `shortcut-${id}`;
    el.append(label, text);
    return el;
}));
const by_id = (_id, f) => {
    const x = id(_id);
    if (x) f(x);
};
Bus.on("media", ({ title }) => by_id("shortcut-np", x => x.innerHTML = html(`[i]${title}[/i]`)));
Bus.on("play", () => by_id("shortcut-playback", x => x.innerText = "Pause session"));
Bus.on("pause", () => by_id("shortcut-playback", x => x.innerText = "Resume playback"));
Bus.on("shuffle-state", () => by_id("shortcut-shuffle", x => x.innerText = display_mode()));
if ('mediaSession' in navigator) {
    const init_media_session = () => {
        navigator.mediaSession.setActionHandler('previoustrack', () => prev.onclick());
        navigator.mediaSession.setActionHandler('nexttrack', () => next.onclick());
    }
    init_media_session();
    window.addEventListener("pageshow", (ev) => {
        if (ev.persisted) {
            const prevMedia = playlist.at(-1);
            if (prevMedia) update_media(prevMedia, get_info(prevMedia.href));
            navigator.mediaSession.setActionHandler("previoustrack", null);
            navigator.mediaSession.setActionHandler("nexttrack", null);
            init_media_session();
        }
    });
}
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("/sw.js");
}
