/* fakels::find.js */
import { main, api, getheader } from "./hook.js";
import mime from "./mime.mjs";
import types from "./mediatype.js";
import $, { id } from "./l.js";
const title = document.title;
const form = main();
const { back, term, btn } = form.children;
const portal = id("porthole");
const music = id("music");
let frame = id("frame");
let query = "", np, queued;
let browser = {};
const playlist = [];
const audio = $("audio");
audio.controls = audio.autoplay = true;
audio.volume = localStorage.lvol || 1;
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
(btn.onclick = () => btn.style.color = back.checked ? "#00b6f0" : "#333")();
export const splitEnd = function(s, x) {
    const l = s.lastIndexOf(x);
    return l ? [s.slice(0, l), s.slice(l + 1)] : [s];
}
export const html = text => text
  .replace(/<\/?(\w*)\s?.*>/g, "")
  .replaceAll("-", "<i>-</i>")
  .replaceAll("[i]", "<i>")
  .replaceAll("[/i]", "</i>");
export const file_info = (link = "50x.html") => {
    const split = link.split("/");
    const file = decodeURI(split[split.length - 1]);
    const [name, ext] = splitEnd(file, ".");
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
        if (!verify_anchor(a)) throw new Error("no clue man");
        return a;
    } catch (err) { console.info("wtf happened!", err.message, term.value) }
}
const next_anchor = (a, looping=true) => {
    const ne = a.parentElement.nextElementSibling; let next;
    if (!is_wrapped_anchor(ne)) {
        const initial = get_first_anchor();
        if (looping && initial) next = initial;
        else return;
    } else next = ne.children[0];
    if (!verify_anchor(next)) return;
    const info = file_info(next.href);
    if (!types[info.ext]) return next_anchor(next, looping);
    if (browser.update) console.log("[player/info]", `next: ${describe(info)}}`);
    return queued = next;
};
import shuffler from "./shuffle.js";
const { shuffle } = shuffler();
const next_queued = () => {
    if (!queued) return;
    playlist.push(queued);
    update_link(shuffling ? shuffle(queued) : next_anchor(queued, true));
};
audio.onplaying = () => document.title = extract_title(file_info(queued?.href).name);
audio.onended = next_queued;
let replay_slot = localStorage.lplay?.replace(/(666|667)/g, await getheader("adapter-port"));
export const anchor_from_link = (link, f=frame) => f.q(`ul > li > a[href="${link.split(":442")[1]}"]`);
let just_popped = false;
window.onpopstate = (ev) => {
    term.value = ev.state;
    btn.click();
    just_popped = true;
};
let shuffling = localStorage.shuffling === "true";
window.toggle_shuffle = () => {
    localStorage.shuffling = shuffling = !shuffling;
    update_status();
};
const status = $('footer');
status.style = `
    position: fixed;
    top: calc(100% - 1.2em);
    background: #ccc;
    color: #000;
    left: 0;
    width: 100%;
    height: 1.2em;
    overflow: hidden;
    padding: 0 .3em;
`;
const active_requests = new Set();
const toggle_status = () => {
    const is = status.isConnected;
    localStorage.status = !is;
    if (is) status.remove();
    else document.body.append(status);
}
const clickable_status = (text, f, cursor) => `<a onclick='${f}()' style='color: #000; cursor: ${cursor}'>${text}</a>`;
const update_status = () => {
    const segments = [
        term.value.includes("music") ? clickable_status(`Shuffle ${shuffling?"on":"off"}`, "toggle_shuffle", "pointer") : frame.children.length > 1 ? `Browsing ${term.value.length ? term.value : "/"}` : "",
        active_requests.size ? `Loading ${Array.from(active_requests).join(", ")}...` : shortcut_ui.isConnected ? "" : clickable_status("Press '?' to view help menu", "toggle_shortcuts", "help")
    ]
    status.innerHTML = segments.filter(value => value.length).join(" | ");
}
const status_obj = (name) => ({ name, list: active_requests, update: update_status });
update_status();
if(localStorage.status !== "false") document.body.append(status);
const found = new Map();
const find_recursive = (root, count={ i: 0, expected: 0 }) => {
    ++count.expected;
    api("ls", root, frame, () => {
        ++count.i;
        const list = frame.children[1].children;
        for (let i = 0; i < list.length; i++) {
            const li = list[i];
            const a = li.children[0];
            const info = file_info(a.href);
            if (!info.name || !mime[info.ext]) find_recursive(root + info.ext + "/", count);
            else if (!found.has(a.href)) found.set(a.href, li);
        }
        if (count.i === count.expected) {
            const fresh = $("div");
            fresh.id = "frame";
            fresh.onclick = frame_handler;
            const label = $("h3");
            label.innerText = `${found.size} entries (recursive find)`;
            const list = $("ul");
            list.append(...found.values());
            fresh.append(label, list);
            frame.replaceWith(fresh);
            frame = fresh;
        }
    }, status_obj(`all directories (${root}`));
};
form.onsubmit = (e) => {
    update_status();
    back.disabled = false;
    e.preventDefault();
    const wildcard = term.value.indexOf("*");
    const dir = term.value.slice(0, wildcard);
    if (wildcard !== -1) {
        find_recursive(`/${dir}`);
        return;
    }
    const v = localStorage.llocation = term.value;
    query = ((v[0] === "/" ? "" : "/") + v + (v.length ? "/" : "")).replace(/[\/\\]+/g, "/");
    back.checked = query.replace("/", "").length;
    btn.onclick();
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
                update_link(reset);
                if (localStorage.ltime && reset.href === localStorage.lplay) audio.currentTime = localStorage.ltime;
            }
        }
        if (!just_popped) history.pushState(query, "", location.origin + path_prefix + query);
        just_popped = false;
    }, status_obj(`directory ${query}`));
};
import { draggable } from "./drag.js";
const popup_savestate = new Map();
let active_popup;
export const popup = window.popup = (el, title, patch=_el=>{}) => {
    if (active_popup) {
        popup_savestate.set(
            active_popup.dataset.title.toLowerCase(), 
            active_popup.style.cssText
        );
        active_popup.remove();
        active_popup = null;
    }
    if (!el) { update_status(); return; };
    const wrapper = $("div");
    wrapper.className = "popup";
    wrapper.style = popup_savestate.get(title.toLowerCase()) ?? `
        display: flex;
        flex-direction: column;
        position: fixed;
        transform: translate(-50%, -50%);
        top: 50%;
        left: 50%;
        background: #111;
        padding: 1em;
        max-height: calc(min(600px, calc(100% - 2em)));
        min-width: calc(min(450px, calc(100% - 2em)));
        box-shadow: 0 0 0 100vmax rgba(0,0,0,.5);
        opacity: .96;
    `;
    wrapper.dataset.title = title;
    const bar = $("div");
    bar.style = `
        margin-bottom: 5px;
        display: flex;
        max-height: 1.5em;
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
    const selector = `[style="background-image: ${link}]`;
    const a = selector + '"]', b = selector + ';"]';
    [...Array.from(wrapper.qa(a)), ...Array.from(wrapper.qa(b)), Array.from(wrapper.c(link))].forEach(b => b.onclick = () => alert("go fuck yourself"));
    document.body.append(draggable(wrapper));
    active_popup = wrapper;
    update_status();
    patch(el);
};
const cancel_popup = ev => active_popup && !active_popup.contains(ev.target) && popup(null);
window.addEventListener("mouseup", cancel_popup);
window.addEventListener("keydown", ev => ev.key === "Escape" && cancel_popup(document.body));
const img = (src, iframe=false) => {
    const img = $(iframe ? "iframe" : "img");
    img.src = src;
    img.style.width = "420px";
    img.style.borderRadius = "5px";
    const i = src.lastIndexOf("/");
    popup(img, src.substring(i + 1));
};
const update_link = window.navigate = (to) => {
    queued = to ? to : get_first_anchor();
    if (!queued || !queued.href) return;
    localStorage.lplay = queued.href;
    const link = queued.href;
    const info = file_info(link);
    if (info.name.length === 0 || !mime[info.ext]) {
        term.value = decodeURI(link.split("%20/")[1]);
        btn.click(); return;
    }
    portal.src = link;
    if (link.includes("/music/") || types[info.ext]) {
        portal.insertAdjacentElement("afterend", audio);
        portal.remove();
        if (link.includes(".jpg")) return img(link);
        if (link.includes(".txt")) return img(link, true);
        audio.src = link;
        np = query;
        const descriptor = describe(info);
        console.log("[player/info]", `now playing: ${extract_title(descriptor)}\n[(file-info)] ${descriptor}`);
        update_music(link, descriptor);
    } else if (browser.remove) {
        audio.insertAdjacentElement("beforebegin", portal);
        audio.remove();
        browser.remove();
    }
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
if (pathname.length > 0) {
        term.value = pathname;
        btn.click();
} else if (localStorage.llocation) {
    term.value = localStorage.llocation;
    btn.click();
}
const frame_handler = (e) => {
    e.preventDefault();
    const c = e.target.children;
    const u = (l) => {
        playlist.push(l);
        update_link(l);
    };
    if (e.target.href) u(e.target);
    if (c.length && c[0].href) u(c[0]);
};
frame.onclick = frame_handler;
export const is_bracket = c => c === 40 || c === 42 || c === 91 || c === 93;
export const is_numeric_ascii = s => {
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c === 32 || c === 45 || c === 46 || c === 59 || is_bracket(c)) continue;
        if (c < 48 || c > 57) return;
    }
    return true;
};
const conjunction_junction = new Set(["for", "and", "nor", "but", "or", "yet", "so", "from", "the", "on", "a", "in", "by", "of", "at", "to"]);
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
    Tweekers: "Tweakers",
    "One Smart": "Some Smart",
    "Thought I K": "K",
    "new You": "new U",
    [n("er")]: n("a"),
    [N("er")]: N("a")
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
      .replaceAll(ignored, "")
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
const song = $("a");
const init_browser = (link, display) => {
    const player = $("div");
    player.className = "music";
    prev.onclick = () => {
        let entry = playlist.pop();
        if (!entry) return;
        if (entry.href === audio.src) entry = playlist.pop();
        if (entry) update_link(entry);
    };
    next.onclick = next_queued;
    prev.textContent = "↩";
    next.textContent = "↪";
    song.dataset.src = decodeURI(link);
    song.innerHTML = html(document.title = extract_title(display));
    let prior = [performance.now()];
    song.onclick = () => {
        audio.src = audio.src;
        const time = performance.now();
        if (prior.length > 2) {
            prior.shift();
            if (time - prior[0] < 1000) toggle_status();
        }
        prior.push(time);
    }
    player.append(
        bundle(prev, label(prev, "prev")),
        bundle(label(song, "♫", "#00b6f0"), song),
        bundle(label(next, "next"), next)
    );
    music.append(player);
    browser = {
        update: (link, display) => {
            song.innerHTML = html(extract_title(display));
            song.dataset.src = link;
            const title = active_popup?.firstElementChild;
            if (!(title && title.firstElementChild.textContent.includes("Shortcuts"))) return;
            active_popup.children[1].firstElementChild.children[1].innerHTML = `<i>${song.innerHTML}</i>`;
        },
        remove: () => {
            player.remove();
            browser = {};
            document.title = title;
        }
    };
};
const update_music = (link, display) => {
    if (browser.update) browser.update(link, display);
    else init_browser(link, display);
};
const load_cover = () => {
    const link = 
        frame.q("[href*='cover.']") ?? 
        frame.q("[href*='art.']") ??
        frame.q("[href*='folder.']");
    link && img(link.href);
};
const get_lyrics = (query, o) => {
    api("l", query, null, html => {
        const el = $("section");
        el.innerHTML = html.replace("and a s", "in a s").replace(/\bpeak\b/g, "peek");
        popup(el, `Lyrics for [i]${ o.artist && o.title ? `${o.artist} - ${o.title}` : query }[/i]`);
        active_lyrics = o.src;
    }, status_obj(`lyrics for '${query}'`), null, true);
}
let active_lyrics;
let lyric_attempt = 0;
const find_lyrics = (src) => {
    if(!src) return;
    if (src === active_lyrics) ++lyric_attempt;
    else lyric_attempt = 0;
    const i = src.lastIndexOf(":442/");
    const dir = src.substring(i + 4);
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
    api("m", dir, null, callback, status_obj(`${song.innerText}'s metadata`), fallback, true);
};
window.toggle_shortcuts = () => shortcut_ui.isConnected ? popup(null) : popup(shortcut_ui, "Shortcuts", el => el.children[0].children[1].innerHTML = `<i>${html(extract_title(describe(file_info(audio.src))))}</i>`);
const shortcuts = {
    "Now-Playing": ["None", () => song.click()],
    " ": ["Play/pause", ev => ev.target !== audio ? (audio.paused ? audio.play() : audio.pause()) : void 0],
    ",": ["Previous", () => prev.click()],
    ".": ["Next", () => next.click()],
    "s": ["Shuffle on/off", toggle_shuffle],
    "c": ["Show cover art", load_cover],
    "l": ["Find lyrics (may fail)", () => find_lyrics(audio.src)],
    ";": ["Find lyrics (specific)", () => get_lyrics(prompt("Enter your search term here:"))],
    "t": ["Toggle status bar", toggle_status],
    "b": ["Go back a directory", () => back.click()],
    "?": ["Bring up this help menu", toggle_shortcuts]
};
export const eval_keypress = (ev, s=shortcuts) => {
    if (document.activeElement === term) return;
    const shortcut = s[ev.key];
    if (shortcut) {
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
    label.style.flexGrow = 1;
    const text = $("span");
    text.innerText = x[0];
    text.style.minWidth = 0;
    text.style.marginLeft = ".3em";
    el.append(label, text);
    return el;
}));
console.info("fakels");