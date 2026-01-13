import { Bus, cover_src, _ } from "./l.js"
import marquee from "./marquee.js";

const svg = {
    play: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
             stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
            <path d="M8 5 L19 12 L8 19 Z"/>
        </svg>
    `,
    pause: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
             stroke-width="2" stroke-linecap="round">
            <path d="M8 5 V19"/>
            <path d="M16 5 V19"/>
        </svg>
    `,
    prev: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
            <path d="M6 5 V19"/>
            <path d="M18 5 L8 12 L18 19 Z"/>
        </svg>
    `,
    loop: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
    `,
    shuffle: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3h5v5" />
            <path d="M4 20L21 3" />
            <path d="M21 16v5h-5" />
            <path d="M15 15l6 6" />
            <path d="M4 4l5 5" />
        </svg>
    `,
    close: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
        </svg>
    `
};

const markup = `
    <div class="cover loading">
        <img />
    </div>
    <div class="container">
        <div class="info">
            <div class="title">Unknown</div>
            <div class="artist">Unknown</div>
        </div>
        <div class="control-group">
            <div class="scrubber-group">
                <div class="scrubber">
                    <div class="progress"></div>
                </div>
                <div class="time-display">
                    <div class="time">0:00</div>
                    <div class="spacer"></div>
                    <div class="time">0:00</div>
                </div>
            </div>
            <div class="controls">
                <button class="mode">${svg.loop}</button>
                <button class="outline prev">${svg.prev}</button>
                <button class="outline play">${svg.play}</button>
                <button class="outline next">${svg.prev}</button>
                <button class="close">${svg.close}</button>
            </div>
        </div>
    </div>
`;

function formatTime(t) {
    t = Math.round(t);
    const m = Math.floor(t / 60);
    let s = t % 60;
    if (s < 10) s = `0${s}`;
    if (m >= 60) {
        const h = Math.floor(m / 60);
        return `${h}:${m % 60}:${s}`;
    }
    return `${m}:${s}`;
};

export default function createPlayer(signal) {
    const main = document.createElement("div");
    main.className = "player-ui";
    main.innerHTML = markup;
    const el = {
        cover_wrap: main.q(".cover"),
        cover: main.q(".cover img"),
        title: main.q(".title"),
        artist: main.q(".artist"),
        elapsed: main.q(".time:first-child"),
        duration: main.q(".time:last-child"),
        scrubber: main.q(".scrubber-group"),
        progress: main.q(".progress"),
        mode: main.q(".mode"),
        prev: main.q(".prev"),
        play: main.q(".play"),
        next: main.q(".next"),
        close: main.q(".close")
    };
    const updateTitle = marquee(el.title);
    const updateArtist = marquee(el.artist);
    el.cover.onload = () => el.cover_wrap.classList.remove("loading");
    let length = 0, scrubTime = null;
    let paused = true;
    const updateProgress = ({ progress, duration }) => {
        length = duration;
        el.progress.style.width = `${progress/duration*100}%`;
        el.elapsed.textContent = formatTime(progress);
        el.duration.textContent = formatTime(duration);
    };
    Bus.on("status", (data) => {
        paused = data.paused;
        el.play.innerHTML = paused ? svg.play : svg.pause;
        updateProgress(data);
    }, { signal });
    Bus.on("time", (data) => scrubTime === null && updateProgress(data), { signal });
    Bus.on("media", (data) => {
        let { artist, album, title } = data.dataset;
        artist ||= "Unknown Artist";
        album ||= "Unknown Album";
        updateTitle(title);
        updateArtist(`${artist} • ${album}`);
        const cover = cover_src(data);
        if (el.cover.src !== cover) {
            el.cover_wrap.classList.add("loading");
            el.cover.src = cover_src(data);
        }
    }, { signal });
    Bus.on("play", () => {
        paused = false;
        el.play.innerHTML = svg.pause;
    }, { signal });
    Bus.on("pause", () => {
        paused = true;
        el.play.innerHTML = svg.play;
    }, { signal });
    Bus.on("shuffle-state", state => {
        el.mode.innerHTML = state === "shuffle" ? svg.shuffle : svg.loop;
        if (state === "repeat") el.mode.classList.add("repeat");
        else el.mode.classList.remove("repeat");
    });
    el.mode.onclick = () => Bus.call.dispatch("switch-mode");
    el.close.onclick = () => Bus.call.dispatch("toggle-player");
    el.prev.onclick = () => Bus.call.dispatch("prev");
    el.next.onclick = () => Bus.call.dispatch("next");
    el.play.onclick = () => {
        if (paused) Bus.call.dispatch("play");
        else Bus.call.dispatch("pause");
    };
    el.scrubber.onpointerdown = (ev) => {
        if (!ev.isPrimary) return;
        el.scrubber.setPointerCapture(ev.pointerId);
        el.scrubber.onpointermove(ev);
    };
    el.scrubber.onpointermove = (ev) => {
        scrubTime = Math.max(0, Math.min(ev.offsetX / el.scrubber.offsetWidth * length, length));
        updateProgress({ progress: scrubTime, duration: length });
    };
    el.scrubber.onpointercancel = el.scrubber.onpointerup = (ev) => {
        if (!ev.isPrimary) return;
        el.scrubber.releasePointerCapture(ev.pointerId);
        Bus.call.dispatch("seek", scrubTime);
        scrubTime = null;
    }
    Bus.call.dispatch("status");
    return main;
}
