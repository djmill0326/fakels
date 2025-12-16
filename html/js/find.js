export const conjunction_junction = new Set(["for", "and", "nor", "but", "or", "yet", "so", "from", "the", "on", "a", "k", "in", "by", "of", "at", "to"]);
import { overrideConsole } from "./tab-log.js"
overrideConsole(); // temporary for mobile
console.info("fakels (Directory Viewer) [v2.6.0]");
import { main, api, getheader } from "./hook.js";
import mime from "./mime.mjs";
import types, { make } from "./mediatype.mjs";
import $, { _, id, handleHold, boundBox, join, style, anchor_from_link } from "./l.js";
import { search, useSearch } from "./search.js";
import { showLyrics } from "./lyrics.js";
const title = document.title;
const form = main();
const { back, term, btn } = form.children;
const portal = id("porthole");
const media = id("media");
let frame = id("frame");
let query = "", np, queued;
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
export const splitEnd = function(s, x) {
    const l = s.lastIndexOf(x);
    return l ? [s.slice(0, l), s.slice(l + 1)] : [s];
}
export const html = text => text
    .replace(/<\/?(\w*)\s?.*>/g, "")
    .replaceAll("-", "<i>-</i>")
    .replaceAll("[i]", "<i>")
    .replaceAll("[/i]", "</i>");
export const get_info = (link = "50x.html") => {
    // fuck this thing. i hate it and how it's used
    // this should have been made sane 100 changes ago
    const split = link.split("/");
    const uri = decodeURI(split.at(-1));
    const [name, ext] = splitEnd(uri, ".");
    if (ext) {
        return { name, ext };
    } else return { name };
};
export const describe = info => `${info.name} [${info.ext ? info.ext : "?"}]`;
const is_wrapped_anchor = l => !!l?.children[0]?.href;
const verify_anchor = a => a.href.lastIndexOf(".") - location.origin.length > 0;
const get_first_anchor = () => {
    try {
        const list = frame.children[1].children[0].children;
        const a = list[0];
        if (!verify_anchor(a)) return;
        return a;
    } catch (err) { console.warn("wtf!", term.value) }
}
const next_anchor = (a, looping=true) => {
    if (!a?.href) return;
    const length = a.parentElement.parentElement.children.length;
    for (let head = a, i = 0; i < length; i++) {
        const entry = head.parentElement.nextElementSibling; 
        let next;
        if (!is_wrapped_anchor(entry)) {
            const initial = get_first_anchor();
            if (looping && initial) next = initial;
            else return;
        } else next = entry.children[0];
        if (!verify_anchor(next)) return;
        const info = get_info(next.href);
        if (types[info.ext] && !next.parentElement.classList.contains("hidden"))
            return queued = next;
        head = next;
    }
};
import shuffler from "./shuffle.js";
const shuffle = window.shuffle = shuffler(frame);
const fade_time = .05;
let fade_controller;
const next_queued = mode => {
    fade_controller?.abort();
    fade_controller = new AbortController();
    const signal = fade_controller.signal;
    const volume = mel.volume;
    const [anchor, link] = resolve_link(shuffling ? shuffle.shuffle() : next_anchor(playlist.at(-1)));
    if (!mode && auto_lyrics) find_lyrics(link, true).then();
    const next = re(make(link));
    next.autoplay = false;
    next.src = link;
    next.classList.add("pending");
    mel.insertAdjacentElement("beforebegin", next);
    let ended = false, end;
    const fade = () => {
        if (signal.aborted) return;
        const remaining = end - mel.currentTime;
        if (ended || remaining <= 0) {
            next.volume = volume;
            next.autoplay = true;
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
        setTimeout(fade);
    };
    const fade_wait = () => {
        if (signal.aborted) return;
        if (end - mel.currentTime <= fade_time) {
            next.play();
            fade();
            return;
        }
        setTimeout(fade_wait);
    };
    next.addEventListener("canplay", () => {
        end = mode === "immediate" ? 0 
            : mode === "now" ? Math.min(mel.currentTime + fade_time, mel.duration) 
            : mel.duration;
        fade_wait();
    }, { once: true, signal });
    mel.ontimeupdate = undefined;
    mel.onended = () => ended = true;
    signal.addEventListener("abort", () => {
        next.remove();
        mel.volume = volume;
        fade_controller = undefined;
    });
};
const re = el => {
    el.ontimeupdate = () => {
        _.ltime = el.currentTime;
        if (el.duration - el.currentTime < 5) next_queued();
    }
    el.onvolumechange = () => _.lvol = el.volume;
    el.onended = () => next_queued("immediate");
    el.onerror = ev => ev.target.error.message.includes("DEMUXER") && next_queued("immediate");
    return el;
};
let replay_slot = _.lplay?.replace(/10(666|667)/g, await getheader("adapter-port"));
let just_popped = false;
window.onpopstate = (ev) => {
    term.value = ev.state;
    btn.click();
    just_popped = true;
};
let shuffling = _.shuffling === "true";
let shuffleHook = () => {}, osh = shuffleHook;
window.toggle_shuffle = () => {
    _.shuffling = shuffling = !shuffling;
    shuffleHook();
    update_status();
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
        frame.children.length > 1 ? `Browsing ${_.ldir?.length ? _.ldir : "/"}` : ""
    ]
    status.innerHTML = segments.filter(value => value.length).join(" | ");
}
const status_obj = (name) => ({ 
    name, list: active_requests, update: update_status, 
    enable() { this.list.add(this.name); this.update() },
    disable() { this.list.delete(this.name); this.update() }
});
update_status();
if(_.status !== "false") document.body.append(status);
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
            if (!info.name || !mime[info.ext]) find_recursive(root + info.ext + "/", count);
            else found.set(a.href, li);
        }
        if (count.i === count.expected) {
            const label = $("h3");
            label.innerText = `${found.size} entries (flat)`;
            const list = $("ul");
            list.append(...found.values());
            frame.firstElementChild.replaceWith(label);
            frame.lastElementChild.replaceWith(list);
            found.clear();
        }
    }, status_obj(`tree (${root})`));
};
const on_load = () => {
    let reset;
    if (replay_slot) {
        reset = anchor_from_link(replay_slot, frame);
        replay_slot = null;
    }
    if (!reset) reset = get_first_anchor();
    if (reset && reset.href) {
        if (!queued) {
            if (!update_link(reset)) return;
            if (_.ltime &&
                _.lplay.slice(_.lplay.lastIndexOf("/") + 1)
                === reset.href.slice(reset.href.lastIndexOf("/") + 1)
            ) mel.currentTime = parseFloat(_.ltime);
        }
    }
};
const clean = x => x.slice(x[0] === "/" ? 1 : 0, x.at(-1) === "/" ? -1 : void 0);
const nav = (t, q) => history.pushState(t, "", location.origin + path_prefix + q.slice(0, -1));
form.onsubmit = (e) => {
    update_status();
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
        if (replay_slot) {
            const i = setInterval(() => c.expected - c.i || clearInterval(i) || on_load(), 50);
        }
        return nav(v, query);
    }
    if (window.rpc && query !== "/link/") window.rpc.socket.emit("rpc", { client: window.rpc.client, event: "browse", data: query });
    console.debug("[fakels/debug]", "query", `'${query}'`);
    api("ls", query, frame, () => {
        if (query === "link") return;
        console.log("[fakels/query]", "found", `'${query}'`);
        if (!just_popped) nav(v, query);
        just_popped = false;
        on_load();
    }, status_obj(`directory ${query}`));
};
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
    boundBox(wrapper, "2em", "450px", "450px", "150px", "900px");
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
const lyrics_prefetch = new Map();
let auto_lyrics = false;
const show_lyrics_file = (src, options) => {
    const { prefetch, signal } = options;
    const key = src.path ?? src;
    if (signal?.aborted) return lyrics_prefetch.delete(key);
    const cache = lyrics_prefetch.get(key);
    if (!prefetch && cache && !cache.src) return requestIdleCallback(() => show_lyrics_file(src, options));
    if (cache?.src) src = cache.src;
    lyrics_prefetch.delete(key);
    const lyrics = cache?.lyrics ?? $("div");
    const name = src.title ?? extract_title(get_info(src));
    const title = `Lyrics for [i]${name}[/i]`;
    const load_lyrics = popup => {
        const popupSignal = popup._controller.signal;
        const mergedSignal = signal ? AbortSignal.any([popupSignal, signal]) : popupSignal;
        popupSignal.addEventListener("abort", () => active_lyrics.delete(key));
        options.signal = mergedSignal;
        if (mergedSignal.aborted) {
            lyrics.remove();
            lyrics_prefetch.delete(key);
        };
        return showLyrics(cache?.lyrics ? cache : src, lyrics, mel, { status: status_obj(`lyrics for '${name}'`), prefetch, signal: mergedSignal });
    }
    if (poppedup?.classList.contains("lyrics-popup")) {
        lyrics.style.opacity = 0;
        poppedup.append(lyrics);
        load_lyrics(poppedup).then(data => {
            if (prefetch) {
                lyrics.remove();
                lyrics_prefetch.set(key, { src, lyrics, data });
                return;
            }
            lyrics.parentElement.q(".lyrics")?.remove();
            lyrics.style.removeProperty("opacity");
            poppedup.q(".bar span").innerHTML = html(title);
        });
        return;
    }
    if (prefetch) return lyrics_prefetch.set(key, { src });
    const p = popup(lyrics, title);
    p.classList.add("lyrics-popup", "pending");
    const auto = $("button");
    auto.innerText = "Auto Lyrics";
    if (auto_lyrics) auto.className = "active";
    auto.onclick = () => {
        auto_lyrics = !auto_lyrics;
        auto.classList[auto_lyrics ? "add" : "remove"]("active");
    }
    p.q(".bar button").insertAdjacentElement("beforebegin", auto);
    load_lyrics(p).then(() => p.classList.remove("pending"));
};
const resolve_link = to => {
    const anchor = typeof to === "number"
        ? frame.children[1].children[to].firstElementChild
        : to ?? get_first_anchor();
    if (!anchor?.href) return [];
    const link = anchor.href = encodeURI(join(decodeURI(anchor.href)));
    return [anchor, link];
};
const update_link = (to, set_src=true) => {
    const [anchor, link] = Array.isArray(to) ? to : resolve_link(to);
    if (!anchor) return;
    queued = anchor;
    _.lplay = link;
    const info = get_info(link);
    if (info.name.length === 0 || !mime[info.ext]) {
        term.value = link.split("%20/")[1];
        btn.click(); return;
    }
    if(set_src) portal.src = link;
    const ifm = types[info.ext];
    if (ifm) playlist.push(queued);
    if (ifm || link.includes("/media/")) {
        if (!mel) {
            mel = re(make(link));
            mel.volume = parseFloat(_.lvol ?? 1);
        }
        portal.insertAdjacentElement("afterend", mel);
        portal.remove();
        if (!ifm) {
            if (link.endsWith(".lrc")) return show_lyrics_file(link, {});
            return img(link, !link.includes(".jpg"));
        }
        frame.lastElementChild.scrollToEl(queued.parentElement);
        if (set_src) mel.src = link;
        np = query;
        const title = extract_title(info);
        document.title = title;
        console.debug("[fakels/debug]", describe(info));
        console.log("[fakels/media]", `'${title}' has queued.\n`);
        update_media(link, info);
        if (auto_lyrics) find_lyrics(link);
        if (shuffleHook === osh) (shuffleHook = sme(shortcut_ui, mel).shuffleHook)();
    } else if (browser.remove) {
        mel.insertAdjacentElement("beforebegin", portal);
        mel.remove();
        browser.remove();
    }
    return ifm;
};
addEventListener("navigate", ev => update_link(frame.children[1].children[ev.detail.i].firstElementChild));
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
useSearch(term, frame);
const frame_handler = (e) => {
    e.preventDefault();
    const target = e.target.href ? e.target : e.target.children[0];
    if (target?.tagName !== "A") return;
    if (search.active) {
        term.value = _.ldir;
        search.reset();
    }
    update_link(target);
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
const prev = $("button");
const next = $("button");
const mref = $("a");
const init_browser = (link, info) => {
    const player = $("div");
    player.className = "player";
    prev.onclick = () => {
        if (playlist.length === 1) return update_link(playlist[0]);
        const entry = playlist.pop();
        if (entry.href === queued?.href) return prev.onclick();
        update_link(entry);
    };
    next.onclick = () => next_queued(mel.paused ? "immediate" : "now");
    prev.textContent = "↩";
    next.textContent = "↪";
    mref.dataset.src = link;
    mref.innerHTML = html(document.title = extract_title(info));
    mref.onclick = () => mel && (mel.currentTime = 0) || mel.play();
    handleHold(mref, toggle_status, null, 500);
    player.append(
        bundle(prev, label(prev, "prev")),
        bundle(label(mref, "♫", "#00b6f0"), mref),
        bundle(label(next, "next"), next)
    );
    media.append(player);
    browser = {
        update: (link, info) => {
            mref.innerHTML = html(extract_title(info));
            mref.dataset.src = link;
            const title = poppedup?.firstElementChild;
            if (!(title && title.firstElementChild.textContent.includes("Shortcuts"))) return;
            poppedup.children[1].firstElementChild.children[1].innerHTML = `<i>${mref.innerHTML}</i>`;
        },
        remove: () => {
            player.remove();
            browser = {};
            document.title = title;
        }
    };
};
const update_media = (link, info) => {
    if (browser.update) browser.update(link, info);
    else init_browser(link, info);
};
const load_art = () => {
    const link = frame.q(`
        [href*='/cover.' i], 
        [href*='/art.' i], 
        [href*='/folder.' i]`
    );
    link && img(link.href);
};
const get_lyrics = (query, o) => {
    api("l", query, null, html => {
        const el = $("section");
        el.innerHTML = html.replace("and a s", "in a s").replace(/\bpeak\b/g, "peek");
        popup(el, `Lyrics for [i]${ o?.artist && o.title ? `${o.artist} - ${o.title}` : query }[/i]`);
        active_lyrics = o.src;
    }, status_obj(`lyrics for '${query}'`), null, true);
}
const metadata = (src) => new Promise(resolve => {
    const name = extract_title(get_info(src));
    const fallback = () => resolve({ title: name });
    const callback = meta => {
        if (!meta) return fallback();
        const c = JSON.parse(meta);
        const artist = c.artist || "";
        const album = c.album?.split(",")[0] || "";
        const title = c.title || "";
        if (title.length) resolve({ artist, album, title })
        else fallback();
    }
    api("m", src, null, callback, status_obj(`${name}'s metadata`), fallback, true);
});
const lrclib_search = async (src, signal) => {
    let status;
    try {
        const { artist, album, title } = await metadata(src);
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
        return { title, path: src, text: results[0]?.syncedLyrics || results[0]?.plainLyrics };
    } catch (_) {
        status?.disable();
        lyrics_prefetch.delete(src);
    }
};
/*let active_lyrics;
let lyric_attempt = 0;*/
const active_lyrics = new Map();
const find_lyrics = async (src, prefetch) => {
    if(!src) return;
    for (const x of Array.from(active_lyrics.values())) {
        if (x.src !== src) {
            x.controller.abort();
            active_lyrics.delete(x);
            continue;
        }
        if (x.prefetch && !prefetch) continue;
        return;
    };
    const controller = new AbortController();
    const signal = controller.signal;
    const entry = { src, prefetch, controller };
    const lrc_src = `${src.slice(0, src.lastIndexOf("."))}.lrc`;
    if (anchor_from_link(lrc_src, frame)) {
        active_lyrics.set(lrc_src, entry);
        if (prefetch) lyrics_prefetch.set(lrc_src, {});
        return show_lyrics_file(lrc_src, { prefetch, signal });
    }
    const path = new URL(src).pathname;
    active_lyrics.set(path, entry);
    const cache = lyrics_prefetch.get(path);
    if (cache) return show_lyrics_file(path, { signal });
    if (prefetch) lyrics_prefetch.set(path, {});
    const lyrics = await lrclib_search(path, signal);
    if (lyrics?.text) return show_lyrics_file(lyrics, { prefetch, signal });
    else active_lyrics.delete(path);
    /*
    if (src === active_lyrics) ++lyric_attempt;
    else lyric_attempt = 0;
    const fallback = () => {
        const i = src.lastIndexOf("/");
        const j = src.lastIndexOf(".");
        const name = decodeURI(path.substring(i + 1, j));  
        let segments = name.split(" ").filter(s => !(((s.length === 4 && s.includes("-")) || s.length === 2) && (s[0] === "0" || s[0] === "1")));
        segments = segments.join(" ").split("- ").filter(s => s.length);
        const last = segments.at(-1);
        const l = last.lastIndexOf("(");
        if (l !== -1) {
            segments.pop();
            segments.push(last.substring(l, last.lastIndexOf(")") + 1));
            segments.push(last.substring(0, l).trim());
        }
        get_lyrics(segments.reverse().slice(0, Math.min(lyric_attempt + 1, segments.length)).join(" "), { active_lyrics, src });
    };
    const callback = ({ artist, album, title }) => {
        let query;
        switch(lyric_attempt % 4) {
            case 0: query = [title]; break;
            case 1: query = [artist, title]; break;
            case 2: query = [artist, album, title]; break;
            case 3: query = [album, title]; break;
            default: return;
        };
        get_lyrics(query.join(" "), { artist, title, src });
    }
    metadata(path).then(callback).catch(fallback);
    */
};
window.toggle_playback = ev => ev?.target === mel ? void 0 : mel.paused ? mel.play() : mel.pause();
window.toggle_shortcuts = () => shortcut_ui.isConnected ? popup(null) : popup(shortcut_ui, "Shortcuts", el => el.children[0].children[1].innerHTML = `<i>${html(extract_title(get_info(mel?.src || "silence.")))}</i>`);
const shortcuts = {
    "Now-Playing": ["None", () => mref.click()],
    " ": ["Play/pause", toggle_playback],
    ",": ["Previous entry", () => prev.click()],
    ".": ["Next entry", () => next.click()],
    "s": ["Shuffle on/off", toggle_shuffle],
    "c": ["Show cover art", load_art],
    "l": ["Find lyrics (may fail)", () => find_lyrics(mel?.src).then()],
    ";": ["Find lyrics (specific)", () => get_lyrics(prompt("Lyrics query:"))],
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
    navigator.mediaSession.setActionHandler('previoustrack', () => mel.currentTime > 4 ? mref.onclick() : prev.onclick());
    navigator.mediaSession.setActionHandler('nexttrack', () => next.onclick());
}
