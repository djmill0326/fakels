export const conjunction_junction = new Set(["for", "and", "nor", "but", "or", "yet", "so", "from", "the", "on", "a", "k", "in", "by", "of", "at", "to"]);
import { overrideConsole } from "./tab-log.js"
overrideConsole("fakels", x => eval(x)); // temporary for mobile
const measure = async () => {
    const { bytes } = await performance.measureUserAgentSpecificMemory();
    console.debug("Memory usage:", parseFloat((bytes / 1000000).toFixed(2)), "MB");
    requestIdleCallback(measure);
};
measure().then();
console.info("fakels (Directory Viewer) [v2.6.0]");
import { main, api, getheader } from "./hook.js";
import mime from "./mime.mjs";
import types, { make } from "./mediatype.mjs";
import $, { _, id, handleHold, boundBox, join, style, anchor_from_link, boundedCache, cover_src, Bus } from "./l.js";
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
let query = "", np, queued, vscroll;
let browser = {};
const playlist = [];
let mel;
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
(btn.onclick = () => requestIdleCallback(() => btn.style.color = back.checked ? "#00b6f0" : "#333"))();
handleHold(btn, () => {
    if (query.at(-2) !== "*") term.value = term.value + (term.value.endsWith("/") ? "*" : "/*");
    btn.click();
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
    return { name: segment.slice(0, dot), ext: segment.slice(dot + 1) };
};
export const describe = info => `${info.name} [${info.ext ? info.ext : "?"}]`;
const is_wrapped_anchor = l => !!l?.children[0]?.href;
const verify_anchor = a => a.href.lastIndexOf(".") - location.origin.length > 0;
const get_first_anchor = () => {
    try {
        const a = activeItems[0].firstElementChild;
        if (verify_anchor(a)) return a;
    } catch (err) { console.warn("wtf!", term.value) }
}
const next_anchor = (a, looping=true) => {
    if (!a?.href) return;
    const length = items.length;
    for (let head = activeItems.findIndex(v => v === a.parentElement), i = 0; i < length; i++) {
        const entry = activeItems[++head];
        let next;
        if (!is_wrapped_anchor(entry)) {
            const initial = get_first_anchor(); 
            if (looping && initial) {
                next = initial;
                head = 0;
            }
            else return;
        } else next = entry.firstElementChild;
        if (!verify_anchor(next)) return;
        const info = get_info(next.href);
        if (types[info.ext]) return next;
    }
};
import shuffler from "./shuffle.js";
const shuffle = window.shuffle = shuffler(activeItems);
const next_track = () => shuffling ? shuffle.peek() : next_anchor(queued);
const fade_time = .05;
let fade_controller;
const next_queued = mode => {
    fade_controller?.abort();
    fade_controller = new AbortController();
    const signal = fade_controller.signal;
    const [anchor, link] = resolve_link(next_track());
    const next = re(make(link));
    next.autoplay = false;
    next.preload = "true";
    next.src = link;
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
            mel.src = "";
            mel.replaceWith(next);
            next.classList.remove("pending");
            mel = next;
            fade_controller = undefined;
            update_link([anchor, link], false);
            return;
        }
        const scale = remaining / fade_time * volume;
        mel.volume = scale;
        next.volume = volume - scale;
        if (mel.paused) {
            next.pause();
            return wait_for_resume(fade);
        }
        if (next.paused) next.play();
        setTimeout(fade);
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
        setTimeout(fade_wait);
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
    el.onerror = ev => ev.target.error.message.includes("DEMUXER") && next_queued("immediate");
    el.onplaying = () => Bus.dispatch("play");
    el.onpause = () => Bus.dispatch("pause");
    return el;
};
let shuffling = _.shuffling === "true";
let shuffleHook = () => {}, osh = shuffleHook;
window.toggle_shuffle = () => {
    _.shuffling = shuffling = !shuffling;
    shuffleHook();
    update_status();
    Bus.dispatch("shuffle-state", shuffling);
};
Bus.call.on("toggle-shuffle", toggle_shuffle);
Bus.call.on("status", () => {
    Bus.dispatch("shuffle-state", shuffling);
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
        _.ldir?.includes("media") ? statbtn(`Shuffle ${shuffling?"on":"off"}`, "toggle_shuffle", "pointer") : "",
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
const refill_items = (iter) => {
    if (iter) items.splice(0, items.length, ...iter);
    activeItems.splice(0, activeItems.length, ...items.filter((item, i) => {
        const node = item.firstElementChild;
        const info = get_info(node.href);
        const withinLibrary = types[info.ext] || !mime[info.ext];
        if (!item.dataset.index) {
            // side-effects in filter. more efficient tho
            item.dataset.index = i;
            if (withinLibrary) enhance_anchor(node, info, true);
        }
        // hide non-media anchors that aren't folders
        if (library_mode && !withinLibrary) return false;
        if (search.term) return search.check(node);
        return true;
    }));
    if (frame.firstElementChild.textContent.endsWith(" entries (flat)"))
        frame.firstElementChild.textContent = `${activeItems.length} entries (flat)`;
    shuffle.invalidate();
    vscroll?.update();
    update_status();
};
const virtualize = () => {
    vscroll?.dispose();
    const list = $("ul");
    vscroll = virtualScroll(list, activeItems, el => {
        const a = el.firstElementChild;
        if (library_mode) enhance_anchor(a);
        else if (a.classList.contains("song-card")) {
            a.classList.remove("song-card");
            a.textContent = a.dataset.name;
        }
        return el;
    });
    frame.lastElementChild.replaceWith(list);
};
const found = new Map();
const find_recursive = (root, count={ i: 0, expected: 0 }) => {
    ++count.expected;
    api("ls", root, frame, () => {
        ++count.i;
        const list = frame.children[1].children;
        for (let i = 0; i < list.length; i++) {
            const li = list[i];
            const a = li.children[0];
            const info = get_info(a.href);
            if (!mime[info.ext]) find_recursive(root + info.name + "/", count);
            else found.set(a.href, li);
        }
        if (count.i === count.expected) {
            virtualize();
            refill_items(found.values());
            found.clear();
            const label = $("h3");
            label.innerText = `${activeItems.length} entries (flat)`;
            frame.firstElementChild.replaceWith(label);
            on_load();
        }
    }, status_obj(`tree (${root})`));
};
const on_load = () => {
    const reset = replay_slot ? anchor_from_link(replay_slot, items) : null;
    replay_slot = null;
    if (!reset?.href) return;
    const lplay = _.lplay;
    if (!queued) {
        if (!update_link(reset)) return;
        if (_.ltime &&
            lplay.slice(lplay.lastIndexOf("/") + 1)
            === reset.href.slice(reset.href.lastIndexOf("/") + 1)
        ) mel.currentTime = parseFloat(_.ltime);
    }
};
const clean = x => x.slice(x[0] === "/" ? 1 : 0, x.at(-1) === "/" ? -1 : void 0);
const nav = (t, q) => history.state === t || history.pushState(t, "", location.origin + path_prefix + q.slice(0, -1));
const enhance_anchor = (el, info, initOnly=false) => {
    if (el.classList.contains("song-card")) return;
    info ??= get_info(el.href);
    const isMedia = !!types[info.ext];
    if (!el.dataset.name) {
        if (isMedia) el.dataset.title ??= extract_title(info);
        el.dataset.name = el.textContent;
    }
    if (initOnly) return;
    el.classList.add("song-card");
    const cover_wrap = $("div");
    cover_wrap.className = "cover loading";
    const cover = $("img");
    cover.onload = () => cover_wrap.classList.remove("loading");
    cover.src = cover_src(el, isMedia);
    cover_wrap.append(cover);
    const text = $("div");
    text.className = "info";
    const title = $("div");
    title.className = "title";
    title.innerText = isMedia ? el.dataset.title : el.dataset.name;
    const artist = $("div");
    artist.className = "artist";
    artist.innerText = isMedia ? (el.dataset.artist || "Unknown Artist") : "Folder";
    text.append(title, artist);
    el.replaceChildren(cover_wrap, text);
};
form.onsubmit = (e) => {
    back.disabled = false;
    e.preventDefault();
    const wildcard = term.value.indexOf("*");
    const dir = term.value.slice(0, wildcard);
    const v = _.ldir = term.value = clean(term.value.replace(/[\/\\]+/g, "/"));
    query = ((v[0] === "/" ? "" : "/") + v + (v.length ? "/" : ""));
    back.checked = query.replace("/", "").length;
    btn.onclick();
    if (wildcard !== -1) {
        const c = { i: 0, expected: 0 };
        find_recursive(`/${dir}`, c);
        return nav(v, query);
    }
    if (window.rpc && query !== "/link/") window.rpc.socket.emit("rpc", { client: window.rpc.client, event: "browse", data: query });
    console.debug("[fakels/debug]", "query", `'${query}'`);
    api("ls", query, frame, () => {
        if (query === "link") return;
        console.log("[fakels/query]", "found", `'${query}'`);
        if (!just_popped) nav(v, query);
        just_popped = false;
        const list = Array.from(frame.lastElementChild.children);
        virtualize();
        refill_items(list);
        on_load();
    }, status_obj(`directory ${query}`));
};
Bus.call.on("navigate", link => {
    term.value = link;
    btn.click();
});
term.oninput = () => term.value === "@" && (term.value = _.ldir);
term.onfocus = () => term.select();
import dragify from "./drag.js";
import { sme } from "./active-info.js";
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
const lrclib_search = async (el, signal) => {
    let status;
    try {
        let { artist, album, title } = el.dataset;
        title ??= extract_title(get_info(el.href));
        const params = new URLSearchParams({
            track_name: title,
            ...(album && { album_name: album }),
            ...(artist && { artist_name: artist })
        });
        status = status_obj(`lrclib for ${title}`);
        status.enable();
        const res = await fetch(`https://lrclib.net/api/search?${params}`, { signal });
        const results = await res.json();
        status.disable();
        return { title, text: results[0]?.syncedLyrics || results[0]?.plainLyrics };
    } catch { status?.disable() }
};
const lyrics_cache = boundedCache(20);
const get_lyrics = (ref, signal, root) => {
    const src = ref.href ?? ref;
    const id = src.slice(0, src.lastIndexOf("."));
    const cached = lyrics_cache.get(id);
    if (cached) return cached;
    const promise = (async () => {
        let text, title;
        const lrc_src = `${id}.lrc`;
        if (anchor_from_link(lrc_src, items)) {
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
        if (root) showLyrics(id, lines, root, null, { 
            status: status_obj(`lyrics for '${title}'`),
            prefetch: true, signal 
        });
        return { lines, title, id };
    })();
    lyrics_cache.set(id, promise);
    promise.catch(() => lyrics_cache.delete(id));
    return promise;
};
let auto_lyrics = _.lyrics === "true";
const lyrics_bus = new EventTarget();
const find_lyrics = async (ref, prefetch) => {
    if (!ref) return;
    const src = ref.href ?? ref;
    const controller = new AbortController();
    const viewController = new AbortController();
    const playerSignal = player.controller?.signal;
    const signals = (popup) => {
        return {
            signal: AbortSignal.any([controller.signal, playerSignal ?? popup._controller.signal]),
            viewSignal: AbortSignal.any([viewController.signal, playerSignal ?? popup._controller.signal])
        };
    };
    const abortOnEvent = (type, controller) => {
        const callback = ({ detail }) => {
            if (detail === src) return;
            controller.abort();
            lyrics_bus.removeEventListener(type, callback);
        }
        lyrics_bus.addEventListener(type, callback);
    };
    const dispatch = (type) => lyrics_bus.dispatchEvent(new CustomEvent(type, { detail: src }));
    dispatch("fetch");
    abortOnEvent("fetch", controller);
    abortOnEvent("display", viewController);
    const fetchRoot = $("div");
    const root = $("div");
    if (player.el || poppedup?.classList.contains("lyrics-popup")) {
        const target = player.el?.q(".container") ?? poppedup;
        const prevLyrics = target.q(".lyrics");
        if (prevLyrics?.dataset.src === src) return;
        if (target !== poppedup) {
            if (!prevLyrics) {
                root.style.maxHeight = 0;
                root.style.opacity = 0;
            } else root.style.maxHeight = `${prevLyrics.offsetHeight}px`; 
        }
        fetchRoot.style.opacity = 0;
        target.append(fetchRoot);
        try {
            const { signal, viewSignal } = signals(target);
            const { title, lines, id } = await get_lyrics(ref, signal, fetchRoot);
            fetchRoot.remove();
            if (prefetch) return true;
            root.dataset.src = src;
            target.append(root);
            showLyrics(id, lines, root, mel, { signal: viewSignal });
            root.style.maxHeight = "100vh";
            root.style.opacity = 1;
            if (target === poppedup) poppedup.q(".bar span").innerHTML = `Lyrics for <i>${title}</i>`;
            else {
                root.addEventListener("click", () => {
                    root.classList.add("expanded");
                }, { signal: viewSignal });
                const close = $("button");
                close.textContent = "×";
                close.onclick = (ev) => {
                    root.classList.remove("expanded");
                    ev.stopPropagation();
                }
                root.q(".overlay").children[0].append(close);
            }
            dispatch("display");
            return true;
        } catch { fetchRoot.remove(); root.remove() }
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
const resolve_link = (to, anchor_only) => {
    const anchor = typeof to === "number"
        ? items[to]?.firstElementChild
        : to;
    if (!anchor?.href) return [];
    if (anchor_only) return [anchor];
    const decodedLink = join(decodeURI(anchor.href));
    const link = anchor.href = encodeURI(decodedLink);
    return [anchor, link, decodedLink];
};
const update_link = (to, set_src=true) => {
    let [anchor, link, decodedLink] = Array.isArray(to) ? to : resolve_link(to);
    if (!anchor) return;
    const info = get_info(link);
    if (!mime[info.ext]) {
        term.value = decodedLink.split(" /")[1];
        btn.click(); return;
    }
    if(set_src) portal.src = link;
    const ifm = types[info.ext];
    if (ifm || link.includes("/media/")) {
        if (!ifm) {
            if (link.endsWith(".lrc")) {
                find_lyrics(link);
                return;
            }
            return img(link, !link.includes(".jpg"));
        }
        if (anchor.index != null) {
            playlist.push(anchor);
            const target = items[anchor.index]?.firstElementChild;
            if (anchor.href === target?.href) anchor = target;
        } else {
            const { artist, album, title, cover } = anchor.dataset;
            const dataset = {
                ...(artist && { artist }),
                ...(album && { album }),
                ...(title && { title }),
                ...(cover && { cover })
            };
            playlist.push({ href: link, dataset, index: parseInt(anchor.parentElement.dataset.index) });
        }
        if (anchor.index == null) queued = anchor;
        if (shuffle.peek() === anchor) shuffle.consume();
        if (!mel) {
            mel = re(make(link));
            mel.volume = parseFloat(_.lvol ?? 1);
        }
        portal.insertAdjacentElement("afterend", mel);
        portal.remove();
        if (items[parseInt(anchor.parentElement?.dataset.index)]?.firstElementChild.href === link) frame.lastElementChild.scrollToEl(anchor.parentElement);
        _.lplay = link;
        if (set_src) mel.src = link;
        np = query;
        const title = anchor.dataset.title ||= extract_title(info);
        document.title = title;
        console.debug("[fakels/debug]", describe(info));
        console.log("[fakels/media]", `'${title}' has queued.\n`);
        update_media(anchor, info);
        if (auto_lyrics) {
            find_lyrics(anchor, !(player.el || poppedup?.classList.contains("lyrics-popup"))).then((done) => done && find_lyrics(next_track(), true));
        }
        if (shuffleHook === osh) (shuffleHook = sme(shortcut_ui, mel).shuffleHook)();
        Bus.dispatch("media", playlist.at(-1));
    } else if (browser.remove) {
        mel.insertAdjacentElement("beforebegin", portal);
        mel.remove();
        browser.remove();
    }
    return ifm;
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
const frame_handler = (e) => {
    e.preventDefault();
    const target = e.target.href ? e.target : e.target.children[0];
    if (target?.tagName !== "A") return;
    if (search.active) {
        term.value = _.ldir;
        search.reset();
    }
    const index = target.parentElement.dataset.index;
    update_link(index ? parseInt(index) : target);
};
frame.onclick = frame_handler;
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
Bus.call.on("toggle_player", toggle_player);
const prev = $("button");
const next = $("button");
const mref = $("a");
const init_browser = (el, info) => {
    const player = $("div");
    player.className = "player";
    prev.onclick = () => {
        if (playlist.length === 1) return update_link(playlist[0]);
        const entry = playlist.pop();
        if (entry.href === mel?.src) return prev.onclick();
        update_link(entry);
    };
    next.onclick = () => next_queued(mel.paused ? "immediate" : "now");
    prev.textContent = "↩";
    next.textContent = "↪";
    mref.dataset.src = el.href;
    mref.innerText = document.title = el.dataset.title ?? extract_title(info);
    mref.onclick = toggle_player;
    handleHold(mref, toggle_status, null, 500);
    player.append(
        bundle(prev, label(prev, "prev")),
        bundle(label(mref, "♫", "#00b6f0"), mref),
        bundle(label(next, "next"), next)
    );
    media.append(player);
    browser = {
        update: (el, info) => {
            mref.innerText = el.dataset.title ?? extract_title(info);
            mref.dataset.src = el.href;
            const title = poppedup?.firstElementChild;
            if (!(title && title.firstElementChild.textContent.includes("Shortcuts"))) return;
            poppedup.children[1].firstElementChild.children[1].innerHTML = `<i>${html(mref.innerHTML)}</i>`;
        },
        remove: () => {
            player.remove();
            browser = {};
            document.title = title;
        }
    };
};
const update_media = (el, info) => {
    if("mediaSession" in navigator) 
        navigator.mediaSession.metadata = new MediaMetadata({ 
            ...el.dataset, 
            artwork: [{ src: cover_src(el) }]
        });
    if (browser.update) browser.update(el, info);
    else init_browser(el, info);
};
const restart_track = () => mel && ((mel.currentTime = 0) || mel.play());
let library_mode = _.library === "true";
const toggle_mode = () => {
    _.library = library_mode = !library_mode;
    refill_items();
};
window.toggle_playback = ev => ev?.target === mel ? void 0 : mel.paused ? mel.play() : mel.pause();
window.toggle_shortcuts = () => shortcut_ui.isConnected ? popup(null) : popup(shortcut_ui, "Shortcuts", el => el.children[0].children[1].innerHTML = `<i>${html(mel?.isConnected ? mref.innerHTML : "Silence")}</i>`);
const shortcuts = {
    "Now-Playing": ["None", restart_track],
    " ": ["Play/pause", toggle_playback],
    ",": ["Previous entry", () => prev.click()],
    ".": ["Next entry", () => next.click()],
    "s": ["Shuffle on/off", toggle_shuffle],
    "l": ["Find lyrics (may fail)", () => find_lyrics(playlist.at(-1))],
    "m": ["Toggle library mode", toggle_mode],
    "p": ["Toggle player view", toggle_player],
    "t": ["Toggle status bar", toggle_status],
    "b": ["Go up a directory", () => back.click()],
    "?": ["Bring up this help menu", toggle_shortcuts]
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
shortcut_ui.append(...Object.entries(shortcuts).map(([key, x]) => {
    const el = $("li");
    el.style.display = "flex";
    el.style.cursor = "pointer";
    el.onclick = () => eval_keypress({ key });
    const label = $("a");
    label.innerText = key.replace(" ", "<Space>");
    label.style.flexShrink = 0;
    const text = $("span");
    text.innerText = x[0];
    el.append(label, text);
    return el;
}));

if ('mediaSession' in navigator) {
    const init_media_session = () => {
        navigator.mediaSession.setActionHandler('previoustrack', () => mel.currentTime > 4 ? restart_track() : prev.onclick());
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
