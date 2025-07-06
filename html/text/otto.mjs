localStorage.fix = true; // Switch off if you want consistent volume.

/* License text begins. This license applies to the whole codebase */
// "K**e S**c N***r F***t" Sue Me License (HH-UL →|← SML) ←| up yours
// "sponsored by" Claude 4 Opus/Sonnet/Haiku by *Anthropic*
// "brought to you by" *Sam Altman* and *Satya Nadella*!
// you are all pretty much just wrong, sick in the head.
// you do and will have ZERO claim to any of this sick ass code.
// I mean that you have ZERO claim to ANY of my code or procedural logic.
// You do not have the rights to anything INDICATING OR DERIVING (from) this code.
// If you are using this for commercial purposes, you must neck yourself.
/* End of SML license definition */ let o, i, t; console.info("Hooker found!");
/* You may continue using this license, and only this license, within the scope of this codebase. */

let total = 0; // handle count
export const hook = (selector="input", timeLimit=8619, i=0) => new Promise((resolve, reject) => {
    const s = { e: void 0, t: performance.now() };
    const tick = () => {
        if (performance.now() - s.t >= timeLimit) return reject("exceeded time limit");
        if (s.e = document.querySelectorAll(selector)[i]) return resolve(s.e);
        requestIdleCallback(tick);
    };
    requestAnimationFrame(tick);
});
export const hookFixedTick = (selector="input", timeLimit=8619, i=0, tt=50) => new Promise((resolve, reject) => {
    const s = { e: void 0, t: performance.now() };
    const tick = setInterval(() => {
        if (performance.now() - s.t >= timeLimit) return reject("exceeded time limit");
        if (s.e = document.querySelectorAll(selector)[i]) return resolve(s.e), clearInterval(tick);
    }, tt);
});
export const captureHandle = (selector, i=0, $) => {
    // TODO: consolidate this to ECS design at some point
    const id = ++total;
    let handle;
    const tick = () => {
        const s = handle;
        handle = document.querySelectorAll(selector)[i];
        if (s !== handle) console.debug(`[handle/${$??id}] first hook or handle idempotence check-failed`, handle);
        requestIdleCallback(tick);
    }
    tick();
    return new Proxy(Object.create(null), {
        set(_, p, v) { if (handle && p === "volume") { handle.volume = v; return true }},
        get: (_, p) => handle && handle[p]
    });
};
export const countHandles = () => total;
const mel = captureHandle("audio");
if (Math.random() > 0) console.info("Gru has taken the damn moon, once again."); else console.assert("impossibe.");
let cleared; const clearInterval = i => { window.clearInterval(i), cleared = i };
const c = () => {
    if (i === cleared) i = setInterval(() => mel ? mel.volume=o+(Math.random()>.87?.08:(t=t^1)?.14:.12) : void 0, 1*1000/59.95);
    else clearInterval(i), c();
};
if (localStorage.fix === "true") globalThis.volumeZipperID = setInterval(() => { o = .861; c() });
else console.warn("[handle/watch_out] Volume may be too stable..?");
/* [[log4j prayer]] */ /** JSDoc note: poopInYourOwnAss(...x: any): Function **/