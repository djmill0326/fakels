/* fakels (Directory Viewer) [v2.5.2] */
export const conjunction_junction = new Set(["for", "and", "nor", "but", "or", "yet", "so", "from", "the", "on", "a", "in", "by", "of", "at", "to"]);
import { main, api, getheader } from "./hook.js";
import mime from "./mime.mjs";
import types, { make } from "./mediatype.js";
import $, { _, id, boundBox, join } from "./l.js";
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
    const split = link.split("/");
    const uri = decodeURI(split[split.length - 1]);
    const [name, ext] = splitEnd(uri, ".");
    if (ext) {
        return { name, ext };
    } else return { name };
};
export const describe = info => `${info.name} [${info.ext ? info.ext : "?"}]`;
const is_wrapped_anchor = l => l && l.children.length && l.children[0].href;
const verify_anchor = a => a.href.lastIndexOf(".") - location.origin.length > 0
const get_first_anchor = () => {
    try {
        const list = frame.children[1].children[0].children;
        const a = list[0];
        if (!verify_anchor(a)) return;
        return a;
    } catch (err) { console.info("wtf!", term.value) }
}
const next_anchor = (a, looping=true) => {
    const ne = a.parentElement.nextElementSibling; let next;
    if (!is_wrapped_anchor(ne)) {
        const initial = get_first_anchor();
        if (looping && initial) next = initial;
        else return;
    } else next = ne.children[0];
    if (!verify_anchor(next)) return;
    const info = get_info(next.href);
    if (!types[info.ext]) return next_anchor(next, looping);
    if (browser.update) console.log("[fakels/media]", `up next: ${info.name}`);
    return queued = next;
};
import shuffler from "./shuffle.js";
const { shuffle } = shuffler();
const next_queued = () => {
    if (!queued) return;
    update_link(shuffling ? shuffle(queued) : next_anchor(queued, true));
};
const re = el => {
    el.onplaying = () => document.title = extract_title(get_info(queued?.href).name);
    el.ontimeupdate = () => _.ltime = el.currentTime;
    el.onvolumechange = () => _.lvol = el.volume;
    el.onended = next_queued;
    return el;
};
let replay_slot = _.lplay?.replace(/(666|667)/g, await getheader("adapter-port"));
export const anchor_from_link = (link, f=frame) => f.q(`ul > li > a[href="${link.split(".xyz")[1]}"]`);
let just_popped = false;
window.onpopstate = (ev) => {
    term.value = ev.state;
    btn.click();
    just_popped = true;
};
let shuffling = _.shuffling === "true";
window.toggle_shuffle = () => {
    _.shuffling = shuffling = !shuffling;
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
const clickable_status = (text, f, cursor) => `<a onclick='${f}()' style='color: #000; cursor: ${cursor}'>${text}</a>`;
const update_status = () => {
    const segments = [
        term.value.includes("media") ? clickable_status(`Shuffle ${shuffling?"on":"off"}`, "toggle_shuffle", "pointer") : frame.children.length > 1 ? `Browsing ${term.value.length ? term.value : "/"}` : "",
        active_requests.size ? `Loading ${Array.from(active_requests).join(", ")}...` : shortcut_ui.isConnected ? "" : clickable_status("Press '?' to browse help menu", "toggle_shortcuts", "help")
    ]
    status.innerHTML = segments.filter(value => value.length).join(" | ");
}
const status_obj = (name) => ({ name, list: active_requests, update: update_status });
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
            else if (!found.has(a.href)) found.set(a.href, li);
        }
        if (count.i === count.expected) {
            const fresh = $("div");
            fresh.id = "frame";
            fresh.onclick = frame_handler;
            const label = $("h3");
            label.innerText = `${found.size} entries (flattened)`;
            const list = $("ul");
            list.append(...found.values());
            fresh.append(label, list);
            frame.replaceWith(fresh);
            frame = fresh, found.clear();
        }
    }, status_obj(`flattened root (${root}`));
};
const b = () => requestIdleCallback(() => {
    const t = parseFloat(_.ltime); 
    if (!mel.buffered.length || mel.buffered.end(0) < t) b();
    else {
        mel.currentTime = t;
        mel.volume = parseFloat(_.lvol ?? 0);
    }
});
const nav = q => history.pushState(q, "", location.origin + path_prefix + q.slice(0, -1));
form.onsubmit = (e) => {
    update_status();
    back.disabled = false;
    e.preventDefault();
    const wildcard = term.value.indexOf("*");
    const dir = term.value.slice(0, wildcard);
    const v = _.ldir = term.value;
    query = ((v[0] === "/" ? "" : "/") + v + (v.length ? "/" : "")).replace(/[\/\\]+/g, "/");
    back.checked = query.replace("/", "").length;
    btn.onclick();
    if (wildcard !== -1) {
        find_recursive(`/${dir}`);
        return nav(query);
    }
    if (window.rpc && query !== "/link/") window.rpc.socket.emit("rpc", { client: window.rpc.client, event: "browse", data: query });
    api("ls", query, frame, () => {
        if (query === "link") return;
        let reset;
        if (replay_slot) {
            reset = anchor_from_link(replay_slot);
            replay_slot = null;
        }
        if (!reset) reset = get_first_anchor();
        if (reset && reset.href) {
            if (!queued) {
                if (!update_link(reset)) return;
                if (_.ltime && reset.href === _.lplay) b();
            }
        }
        if (!just_popped) nav(query);
        just_popped = false;
    }, status_obj(`directory ${query}`));
};
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
        poppedup = null;
    }
    if (!el) { update_status(); return; };
    const wrapper = $("div");
    wrapper.className = "popup";
    wrapper.style = popup_savestate.get(title.toLowerCase()) ?? `
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
        display: flex;
        flex-direction: column;
    `;
    boundBox(wrapper, "2em", "450px", "600px", null, "800px");
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
    document.body.append(dragify(wrapper));
    poppedup = wrapper;
    update_status();
    patch(el);
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
const update_link = window.navigate = (to) => {
    queued = to ? to : get_first_anchor();
    if (!queued || !queued.href) return;
    const link = _.lplay = queued.href = join(decodeURI(queued.href));
    const info = get_info(link);
    if (info.name.length === 0 || !mime[info.ext]) {
        term.value = link.split(" /")[1];
        btn.click(); return;
    }
    portal.src = link;
    const ifm = types[info.ext];
    if (ifm) playlist.push(queued);
    if (ifm || link.includes("/media/")) {
        if (!mel) mel = re(make(link));
        portal.insertAdjacentElement("afterend", mel);
        portal.remove();
        if (!ifm) return img(link, !link.includes(".jpg"));
        frame.lastElementChild.scrollToEl(queued.parentElement);
        mel.src = link;
        np = query;
        const descriptor = describe(info);
        console.log("[fakels/media]", `'${extract_title(descriptor)}' has been queued.\n(get_info/out) ${descriptor}`);
        update_media(link, descriptor);
    } else if (browser.remove) {
        mel.insertAdjacentElement("beforebegin", portal);
        mel.remove();
        browser.remove();
    }
    return ifm;
};
let pathname = decodeURI(window.location.pathname).slice(1);
const paths = ["raw", "stylish"];
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
const frame_handler = (e) => {
    e.preventDefault();
    const target = e.target.href ? e.target : e.target.children[0];
    if (target?.tagName !== "A") return;
    update_link(target);
};
frame.onclick = frame_handler;
export const is_bracket = c => c === 40 || c === 42 || c === 91 || c === 93;
export const is_numeric_ascii = s => {
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c === 32 || c === 36 || c === 45 || c === 46 || c === 59 || is_bracket(c)) continue;
        if (c < 48 || c > 57) return;
    }
    return true;
};
export const capitalize = text => text.split(".").map(s => s.split(" ").filter(w => w.length).map((word, i) => {
    if (i && conjunction_junction.has(word)) return word;
    return word[0].toUpperCase() + word.slice(1);
}).join(" ")).join(".");
export const n = (s="a", c=0) => `${c?"N":"n"}igg${s}`, N = s => n(s, 1);
const ignored = /(\(|\[)(explicit|clean)(\]|\))/gi;
const swaps = {
    usa: "USA",
    Sun_: "Sun?",
    Shit_: "Shit:",
    "One Sm": "Some Sm",
    [n("er")]: n("a"),
    [N("er")]: N("a"),
    "Thought I Knew You": "Knew U",
};
const swap = s => Object.entries(swaps).forEach(([k, v]) => s = s.replace(k, v)) ?? s;
export const extract_title = text => {
    const end = text.lastIndexOf("[");
    return capitalize(text
      .slice(0, end === -1 ? void 0 : end)
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
const init_browser = (link, display) => {
    const player = $("div");
    player.className = "player";
    prev.onclick = () => {
        const entry = playlist.pop();
        if (entry) {
            if (entry.href === queued.href) return queueMicrotask(() => prev.click());
            update_link(entry);
        }
    };
    next.onclick = next_queued;
    prev.textContent = "↩";
    next.textContent = "↪";
    mref.dataset.src = decodeURI(link);
    mref.innerHTML = html(document.title = extract_title(display));
    let prior = [performance.now()];
    mref.onclick = () => {
        if(mel) mel.src = mel.src;
        const time = performance.now();
        if (prior.length > 2) {
            prior.shift();
            if (time - prior[0] < 1337) toggle_status();
        }
        prior.push(time);
    }
    player.append(
        bundle(prev, label(prev, "prev")),
        bundle(label(mref, "♫", "#00b6f0"), mref),
        bundle(label(next, "next"), next)
    );
    media.append(player);
    browser = {
        update: (link, display) => {
            mref.innerHTML = html(extract_title(display));
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
const update_media = (link, display) => {
    if (browser.update) browser.update(link, display);
    else init_browser(link, display);
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
let active_lyrics;
let lyric_attempt = 0;
const find_lyrics = (src) => {
    if(!src) return;
    if (src === active_lyrics) ++lyric_attempt;
    else lyric_attempt = 0;
    const i = src.lastIndexOf(".xyz/");
    const dir = src.substring(i + 4);
    console.lo
    const fallback = () => {
        const i = dir.lastIndexOf("/");
        const j = dir.lastIndexOf(".");
        const name = decodeURI(dir.substring(i + 1, j));  
        let segments = name.split(" ").filter(s => !(((s.length === 4 && s.includes("-")) || s.length === 2) && (s[0] === "0" || s[0] === "1")));
        segments = segments.join(" ").split("- ").filter(s => s.length);
        const k = segments.length - 1;
        const last = segments[k];
        const l = last.lastIndexOf("(");
        if (l !== -1) {
            segments.pop();
            segments.push(last.substring(l, last.lastIndexOf(")") + 1));
            segments.push(last.substring(0, l).trim());
        }
        get_lyrics(segments.reverse().slice(0, Math.min(lyric_attempt + 1, segments.length)).join(" "), { active_lyrics, src });
    };
    const callback = meta => {
        if (!meta) return fallback();
        const c = JSON.parse(meta);
        const artist = c.artist || "";
        const album = c.album?.split(",")[0] || "";
        const title = c.title || "";
        if (!title.length) return fallback();
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
    api("m", dir, null, callback, status_obj(`${mref.innerText}'s metadata`), fallback, true);
};
window.toggle_playback = ev => ev?.target === mel ? void 0 : mel.paused ? mel.play() : mel.pause();
window.toggle_shortcuts = () => shortcut_ui.isConnected ? popup(null) : popup(shortcut_ui, "Shortcuts", el => el.children[0].children[1].innerHTML = `<i>${html(extract_title(describe(get_info(mel?.src || "silence."))))}</i>`);
const shortcuts = {
    "Now-Playing": ["None", () => mref.click()],
    " ": ["Play/pause", toggle_playback],
    ",": ["Previous entry", () => prev.click()],
    ".": ["Next entry", () => next.click()],
    "s": ["Shuffle on/off", toggle_shuffle],
    "c": ["Show cover art", load_art],
    "l": ["Find lyrics (may fail)", () => find_lyrics(mel?.src)],
    ";": ["Find lyrics (specific)", () => get_lyrics(prompt("Lyrics query:"))],
    "t": ["Toggle status bar", toggle_status],
    "b": ["Go up a directory", () => back.click()],
    "?": ["Bring up this help menu", toggle_shortcuts]
};
export const eval_keypress = (ev, s=shortcuts) => {
    if (document.activeElement === term) return;
    const shortcut = s[ev.key];
    if (shortcut) {
        console.debug("[fakels/input]", `'${ev.key}'`, ...shortcut);
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
console.info("fakels (Directory Viewer) [v2.5.2]");