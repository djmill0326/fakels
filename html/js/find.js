performance.mark("init-begin");
let has_loaded = false, has_played = false;
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
import { main, api, getheader, active_requests, status_obj, api2 } from "./hook.js";
import mime from "./mime.mjs";
import types, { make } from "./mediatype.mjs";
import $, { _, id, handleHold, boundBox, join, style, boundedCache, cover_src, display_mode, Bus, tag_sorters, tag_shorthand, tag_normalizers, tag_remap, tag_concise, overlay, staticQuery, perf_report } from "./l.js";
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
const playlist = [];
const shortcut_ui = $("ul");
const resolve_metadata = async (list) => {
    if (!list?.length) return [];
    try {
        return (await api2("ls", "-m", { opt: {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: typeof list === "string" ? list : JSON.stringify(list)
        } })).files?.map(item => init_item(item)) ?? [];
    } catch (err) {
        console.error("Failed to resolve metadata", err);
    }
};
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
        if (next?.isMedia && !next?.stale) return next;
    }
};
import shuffler from "./shuffle.js";
const shuffle = window.shuffle = shuffler(activeItems);
const queue_head = () => queue.values().next().value;
const next_track = () => queue_head() ?? (mode === "shuffle" ? shuffle.peek() : mode === "repeat" ? playlist.at(-1) : next_item(queued));
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
    el.loading = "eager";
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
Bus.call.on("update-status", update_status);
if(_.status !== "false") document.body.append(status);
const pc = (singular, plural) => count => count - 1 ? plural : singular;
const item_name = pc("item", "items");
const entry_name = pc("entry", "entries");
const update_frame_counts = () => {
    const el = frame.firstElementChild;
    if (!el) return;
    const len = activeItems.length;
    el.textContent = el.textContent
        .replace(/ \(\d+ items?\)$/, ` (${len} ${item_name(len)})`)
        .replace(/\d+ entr(ies|y) \(flat\)$/, `${len} ${entry_name(len)} (flat)`);
};
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
export const capitalize = word => (word[0] || "").toUpperCase() + word.slice(1);
export const title_case = text => text.split(".").map((s, i) => s.split(" ").map((word, j) => {
    if ((i + j) && conjunction_junction.has(word)) return word;
    return capitalize(word);
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
    return title_case(name
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

const init_item = (item, info) => {
    item.href = join(item.href);
    if (item.isDir == null && item.isMedia == null) {
        info ??= get_info(item.href);
        item.isDir = !mime[info.ext];
        item.isMedia = !!types[info.ext];
    }
    if (item.isDir || item.isMedia) item.cover = cover_src(item, item.isMedia || false);
    if (item.isMedia) item.title ??= extract_title(info);
    return item;
};
const refill_items = (iter, mode_override) => {
    if (iter) items.splice(0, items.length, ...iter, ...(virtual_roots[_.ldir] || []));
    const t = performance.now();
    let activeIndex = 0;
    activeItems.splice(0, activeItems.length, ...items.filter((item, i) => {
        const info = get_info(item.href);
        const withinLibrary = types[info.ext] || !mime[info.ext];
        if (item.id == null) init_item(item, info);
        item.id = i;
        item.fav = favorites.has(item.href);
        let result = true;
        // hide non-media anchors that aren't folders
        if (library_mode && !withinLibrary) result = false;
        else if (search.term) result = search.check(item);
        if (result) {
            item.activeIndex = activeIndex++;
            const queueItem = queue.get(item.href);
            if (queueItem) queueItem.id = i;
        }else item.activeIndex = null;
        return result;
    }));
    console.debug(`activeItems fill took ${(performance.now() - t).toFixed(2)} ms`);
    update_frame_counts();
    shuffle.invalidate();
    if (mode_override) force_mode = mode_override;
    vscroll?.update(force_mode ?? (library_mode ? "enhanced" : "basic"));
    update_status();
    on_load();
};
const queue = new Map((await resolve_metadata(_.queue))?.map(item => [item.href, item]));
const enhance_anchor = (el) => {
    el.classList.add("song-card");
    const cover = $("img");
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
const anchor_overlay = (el) => overlay(el.firstElementChild, { sticky: false }).add("bottom-right", $("span", { className: "queue-indicator" }), $("span", { textContent: "🌟", style: { display: "none" } }));
const overlay_update = (a, item) => {
    const o = overlay(a).get("bottom-right");
    const queued = queue.has(item.href);
    o.setAttribute("data-queued", queued);
    o.setAttribute("data-fav", item.fav);
    o.firstElementChild.textContent = queued ? "Queued" : "";
    o.lastElementChild.textContent = item.fav ? "🌟" : "";

};
const vscroll_modes = {
    basic: {
        shell() {
            const el = basicShell.cloneNode(true);
            anchor_overlay(el);
            return el;
        },
        update(el, item) {
            const a = el.firstElementChild;
            a.href = item.href;
            a.firstChild.data = item.name;
            el.setAttribute("data-id", item.id);
            if (item.stale) el.setAttribute("data-stale", true);
            overlay_update(a, item);
        }
    },
    enhanced: {
        shell() {
            const el = enhancedShell.cloneNode(true);
            anchor_overlay(el);
            staticQuery(el, {
                cover: ".cover",
                title: ".title",
                artist: ".artist",
            });
            const cover = el.sq.cover;
            cover.onload = () => cover.setAttribute("data-loaded", true);
            return el;
        },
        update(el, item) {
            const a = el.firstElementChild;
            a.href = item.href;
            el.setAttribute("data-id", item.id);
            if (item.stale) el.setAttribute("data-stale", true);
            const cover = el.sq.cover;
            const src = item.cover;
            if (cover._src !== src) {
                cover.removeAttribute("data-loaded");
                cover.src = cover._src = src;
            }
            el.sq.title.textContent = item.isMedia ? item.title : item.name;
            el.sq.artist.textContent = item.isMedia ? (item.artist || "Unknown Artist") : "Folder";
            overlay_update(a, item);
        }
    } 
};
const virtualize = (name, fwd) => {
    vscroll?.dispose();
    const title = $("h3");
    title.textContent = name;
    const list = $("ul");
    vscroll = virtualScroll(list, vscroll_modes, activeItems, items, { focusable: el => el.firstElementChild, ...fwd });
    if (_.player === "true") vscroll.watchResize(container);
    frame.replaceChildren(title, list);
};
const normalize_tag = (value, tag) => tag_normalizers[tag]?.(value) || value;
const sorted = (list, tag) => {
    const f = tag_sorters[tag] || tag_sorters.default;
    if (list[0].length === 2) list.sort(([a], [b]) => f(a, b));
    else list.sort((a, b) => f(a.name, b.name));
    return list;
}
const hierarchicalize = (items, spec) => {
    const root = {};
    for (const item of items) {
        const info = get_info(item.href);
        if (!types[info.ext]) continue;
        spec.reduce((n, tag, i) => n[normalize_tag(item[tag_remap[tag] ?? tag], tag).replaceAll?.("/", "∕")] ??= (i === spec.length - 1 ? [] : {}), root).push(item);
    }
    return root;
};
const sort_hierarchy = (spec, root, depth=0) => depth < spec.length ? Object.fromEntries(sorted(Object.entries(root), spec[depth]).map(([name, item]) => [name, sort_hierarchy(spec, item, depth + 1)]), spec[depth]) : root;
const flat = (root, list, tag) => {
    let should_index;
    if (!list) {
        should_index = true;
        jump_index = [];
    }
    list ??= [];
    if (Array.isArray(root)) list.push(...root);
    else for (const k in root) {
        if (should_index) {
            const transform = tag_concise[tag] || tag_concise.default;
            const transformed = transform(k);
            if (jump_index.at(-1)?.[1] !== transformed)
                jump_index.push([list.length, transformed]);
        }
        flat(root[k], list);
    }
    return list;
};
let splat_map, last_splat, last_spec, item_cache, jump_index, is_splat_sorted = false;
const splat = (path, items, mode_override) => {
    if (items) item_cache = Array.from(items);
    const [primary, splat_path] = path.split("**");
    const [spec_str, ...paths] = splat_path.split("/");
    let spec = ["artist", "album"];
    if (spec_str.startsWith(":")) spec = spec_str.slice(1).split("").map(x => tag_shorthand[x]);
    if (items || spec_str !== last_spec) {
        splat_map = hierarchicalize(item_cache, spec);
        is_splat_sorted = false;
    }
    const is_flat = paths.at(-1) === "*";
    if (is_flat) {
        paths.pop();
        if (!is_splat_sorted) {
            splat_map = sort_hierarchy(spec, splat_map);
            is_splat_sorted = true;
        }
    }
    const dir = paths.length ? (paths.reduce((o, k) => o?.[k], splat_map) || []) : splat_map;
    if (is_flat) {
        const flattened = flat(dir, null, spec[paths.length]);
        virtualize(hierarchical_title("Sorted", spec) + " (0 items)", { anchors: jump_index });
        refill_items(flattened);
    }
    else {
        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        const list = Object.entries(dir).map(([name, item]) => {
            if (item.href) return item;
            return { name, href: `${encodedPath}/${encodeURIComponent(name)}`, isDir: true };
        }) || [];
        virtualize(`${paths.length === 0 ? capitalize(spec[paths.length]) + "s" : paths.at(-1)} (0 items)`);
        refill_items(!is_splat_sorted && paths.length < spec.length ? sorted(list, spec.at(paths.length)) : list, mode_override);
    }
    last_splat = primary;
    last_spec = spec_str;
};
const unsplat = items => {
    item_cache = items;
    last_spec = last_splat = null;
};
const splat_or_refill = (items, mode_override) => _.ldir.includes("**") 
    ? splat(_.ldir, items, mode_override) 
    : refill_items(items, mode_override) || unsplat(items);
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
    }, status_obj(`tree (${root})`), null, false, true);
};
const on_load = async () => {
    performance.mark("view-loaded");
    if (!has_loaded) perf_report("Entry -> Path view loaded", "init-begin", "view-loaded")
    perf_report("Submit -> Path view loaded", "submit", "view-loaded")
    has_loaded = true;
    if (!replay_slot || queued) return;
    const reset = items.find(item => item.href === replay_slot) || (await resolve_metadata([replay_slot]))?.[0];
    replay_slot = null;
    if (!reset || reset.stale || !update_link(reset)) return;
    mel?.addEventListener("canplay", () => {
        performance.mark("canplay");
        if (!has_played) perf_report("Entry -> Playback available", "init-begin", "canplay");
        perf_report("Select -> Playback available", "select", "canplay");
        has_played = true;
    });
    has_loaded = true;
    if (_.ltime &&
        _.lplay.slice(_.lplay.lastIndexOf("/") + 1)
        === reset.href.slice(reset.href.lastIndexOf("/") + 1)
    ) mel.currentTime = parseFloat(_.ltime);
};
const hierarchical_title = (name, tags) => {
    let title = name;
    if (tags.length) title += ` – ${tags.map(capitalize).join(" > ")}`;;
    return title;

}
let virtual_paths = Object.entries({
    "media/Queue": () => {
        virtualize(`Queue (${queue.size} items)`);
        splat_or_refill(queue.values());
    },
    "media/Favorites": async () => {
        const favs = await resolve_metadata([...favorites]);
        virtualize(`Favorites (${favs.length} items)`);
        splat_or_refill(favs);
    },
    "media/Hierarchical": () => {
        const path = _.ldir;
        let segments = path.toLowerCase().split("/").slice(2);
        const map = Object.entries(tag_shorthand);
        const tags = segments.map(s => map.find(([_, tag]) => tag === s));
        if (tags.some(tag => tag == null)) {
            term.value = "media/Hierarchical/" + tags.filter(tag => tag != null).map(([_, tag]) => tag).join("/");
            form.dispatchEvent(new Event("submit"));
            return;
        }
        const available = map.map(([_, tag]) => tag).filter(tag => !segments.includes(tag)).map(capitalize);
        const spec = tags.map(([c]) => c).join("");
        virtualize(hierarchical_title("Hierarchy Builder", tags.map(([_, tag]) => tag)));
        splat_or_refill([
            ...available.map(tag => ({ name: `By ${tag}`, href: `${path}/${tag}` })),
            ...(segments.length ? [
                { name: "Materialize", href: `media/**:${spec}` },
                { name: "Flatten", href: `media/**:${spec}/*/` }
            ] : [])
        ], "basic");
    }
});
const virtual_roots = {};
virtual_paths.forEach(([path]) => {
    const i = path.lastIndexOf("/");
    const root = i === -1 ? "" : path.slice(0, i);
    virtual_roots[root] ??= [];
    virtual_roots[root].push({ 
        name: path.slice(i + 1), 
        href: path, 
        virtual: true 
    });
});
virtual_paths = Object.fromEntries(virtual_paths.sort(([a], [b]) => b.length - a.length));
const virtual_path = dir => Object.keys(virtual_paths).find(path => dir.startsWith(path));
const clean = x => x.slice(x[0] === "/" ? 1 : 0, x.at(-1) === "/" ? -1 : void 0);
const nav = (t, q) => history.state === t || history.pushState(t, "", location.origin + path_prefix + q.slice(0, -1));
form.onsubmit = async (e) => {
    force_mode = null;
    performance.mark("submit");
    e.preventDefault();
    back.disabled = false;
    if (search.term && term.value.endsWith(search.term)) {
        if (vscroll && activeItems.length) {
            const head = vscroll.head();
            if (head) {
                term.blur();
                update_link(head);
                setTimeout(() => vscroll.focus(head), 0);
            }
        }
        return;
    }
    term.blur();
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
            if (virtualPath) await virtual_paths[virtualPath]();
            else find_recursive(`/${dir}`);
        }
        return do_nav();
    }
    if (window.rpc && query !== "/link/") window.rpc.socket.emit("rpc", { client: window.rpc.client, event: "browse", data: query });
    console.debug("[fakels/debug]", "query", `'${query}'`);
    unsplat();
    if (virtualPath) {
        await virtual_paths[virtualPath]();
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
    exit.textContent = "✖";
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
        root.style.opacity = 0; 
        let loading;
        if (!prefetch) {
            loading = $("div");
            loading.className = "lyrics";
            const text = $("div");
            text.className = "lyrics-text loading";
            text.textContent = "Loading lyrics...";
            loading.append(text);
            if (prevLyrics) prevLyrics.replaceWith(loading);
            else target.append(loading);
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
                handleHold(root, { onHold: () => {
                    root.classList.add("expanded")
                }, signal: viewSignal });
                window.addEventListener("keydown", ev => ev.key === "Escape" 
                    && !poppedup 
                    && root.classList.contains("expanded") 
                    && (close.onclick() || ev.preventDefault()),
                true);
                root.addEventListener("contextmenu", e => e.preventDefault(), { signal: viewSignal });
                const close = $("button");
                close.textContent = "×";
                close.onclick = () => {
                    root.q(".menu-btn[data-open=true]")?.click();
                    root.classList.remove("expanded");
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
        auto.textContent = "Auto Lyrics";
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
    performance.mark("select");
    const item = resolve(to);
    const link = item.href;
    if (!item || item.stale) return;
    if (item.isDir) {
        term.value = link.split("/").map(decodeURIComponent).join("/");
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
        const queue_item = queue_head()
        if (queue_item === item) {
            const el = frame.querySelector(`[data-id="${item.id}"] .queue-indicator`);
            if (el) {
                el.textContent = "";
                el.parentElement.setAttribute("data-queued", false);
            }
            remove_queued(queue_item);
        }
        shuffle.consume(item.activeIndex);
        if (!mel) {
            mel = re(make(link));
            mel.volume = parseFloat(_.lvol ?? 1);
        }
        portal.insertAdjacentElement("afterend", mel);
        portal.remove();
        if (activeItems[item.activeIndex] === item || item.href.slice(1).startsWith(encodeURI(_.ldir.slice(0, (_.ldir.indexOf("/*") + 1) || null)))) {
            // a real man would .includes the entire activeItems array
            queued = item;
            if (item.id != null) vscroll.scrollTo(item.id);
        }
        _.lplay = link;
        if (set_src) {
            fade_controller?.abort();
            mel.src = link;
        }
        np = query;
        const info = get_info(item.href);
        console.debug("[fakels/debug]", describe(info));
        console.log("[fakels/media]", `'${item.title}' has queued.\n`);
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
useSearch(term, refill_items);
const clear_search = (force) => {
    if (force || search.term && !search.persistent) {
        term.value = _.ldir;
        search.reset();
    }
};
const dispatch_anchor = (f) => (e, ...x) => {
    const target = e.target.href ? e.target.parentElement : e.target;
    if (target?.tagName !== "LI") return;
    e.preventDefault();
    f(target, e, ...x);
};
const frame_handler = dispatch_anchor(update_link);
frame.onclick = frame_handler;
window.addEventListener("keypress", ev => ev.key === " " && ev.preventDefault());
const favorites = new Set(JSON.parse(_.favorites ?? "[]"));
const update_favorites = (k) => {
    const v = !favorites.has(k);
    if (v) favorites.add(k);
    else favorites.delete(k);
    _.favorites = JSON.stringify(Array.from(favorites));
    return v;
};
const toggle_favorite = (el) => {
    const item = resolve(el);
    const a = el.firstElementChild;
    const favorited = update_favorites(item.href);
    item.fav = favorited;
    const o = overlay(a).get("bottom-right");
    o.setAttribute("data-fav", favorited);
    o.lastElementChild.textContent = favorited ? "🌟" : "";
    if (favorited) return;
    const in_favs = _.ldir.startsWith("media/Favorites");
    if (in_favs) items.splice(item.id, 1);
    if (in_favs || (search.term && !search.check(item))) refill_items();
}
const toggle_queued = (x, v) => {
    const a = x instanceof HTMLElement && x.firstElementChild;
    const item = resolve(x);
    const will_queue = !queue.has(item.href);
    if (will_queue) queue.set(item.href, item);
    const viewing_queue = _.ldir.startsWith("media/Queue");
    if (v === 2 && !viewing_queue) {
        term.value = "media/Queue";
        btn.click();
        return;
    }
    if (a && (will_queue || !viewing_queue)) {
        const o = overlay(a).get("bottom-right");
        o.setAttribute("data-queued", will_queue);
        o.firstElementChild.textContent = will_queue ? "Queued" : "";
    }
    if (!will_queue) {
        remove_queued(item);
        return;
    }
}
const remove_queued = (item) => {
    queue.delete(item.href);
    if (_.ldir.startsWith("media/Queue")) {
        items.splice(item.id, 1);
        refill_items(items);
    }
}
handleHold(frame, {
    t: [400, 400, 800],
    needsRelease: true,
    onHold: dispatch_anchor((el, _, i) => 
        (i ? toggle_queued : toggle_favorite)(el, i)),
    onStart: dispatch_anchor((el) => el.classList.add("held")),
    onEnd: dispatch_anchor((el) => el.classList.remove("held"))
});
let label_idx = 0;
export const label = (el, text, color="#444") => {
    const label = $("label");
    if (!el.id.length) {
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
    if (player.lock) return;
    vscroll?.watchResize(container);
    player.controller = new AbortController();
    player.el = createPlayer(player.controller.signal);
    player.lock = true;
    container.append(player.el);
    setTimeout(() => player.el.classList.add("open"), 0);
    setTimeout(() => player.lock = false, 200);
    if (auto_lyrics && playlist.at(-1)) find_lyrics(playlist.at(-1));
};
if (_.player === "true") open_player();
const toggle_player = () => {
    if (player.lock) return;
    _.player = _.player !== "true";
    if (!player.el) open_player()
    else {
        player.controller.abort();
        player.el.classList.remove("open");
        player.lock = true;
        setTimeout(() => {
            player.el.remove();
            player = {};
            vscroll.watchResize();
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
    mref.textContent = document.title = item.title ?? extract_title(info);
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
            mref.textContent = item.title;
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
let library_mode = _.library === "true", force_mode = null;
const toggle_mode = () => {
    _.library = library_mode = !library_mode;
    refill_items();
};
window.toggle_playback = ev => ev?.target === mel ? void 0 : mel.paused ? mel.play() : mel.pause();
window.toggle_shortcuts = () => shortcut_ui.isConnected ? popup(null) : popup(shortcut_ui, "Shortcuts", el => {
    id("shortcut-np").innerHTML = `<i>${html(mel?.isConnected ? mref.innerHTML : "Silence")}</i>`
    if (mel.isConnected) id("shortcut-playback").textContent = mel.paused ? "Resume playback" : "Pause session";
    id("shortcut-shuffle").textContent = display_mode();
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
    "/": [null, () => setTimeout(() => term.focus(), 0)],
    "@": [null, () => document.activeElement === term || clear_search(true)]
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
    label.textContent = key.replace(" ", "<Space>");
    label.style.flexShrink = 0;
    const text = $("span");
    text.textContent = name;
    text.id = `shortcut-${id}`;
    el.append(label, text);
    return el;
}));
const by_id = (_id, f) => {
    const x = id(_id);
    if (x) f(x);
};
Bus.on("media", ({ title }) => by_id("shortcut-np", x => x.innerHTML = html(`[i]${title}[/i]`)));
Bus.on("play", () => by_id("shortcut-playback", x => x.textContent = "Pause session"));
Bus.on("pause", () => by_id("shortcut-playback", x => x.textContent = "Resume playback"));
Bus.on("shuffle-state", () => by_id("shortcut-shuffle", x => x.textContent = display_mode()));
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
window.addEventListener("beforeunload", () => {
    _.queue = JSON.stringify([...queue.keys()]);
});
term.value = (pathname.length ? pathname : _.ldir) ?? "";
btn.click();
