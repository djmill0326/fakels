export const _ = localStorage;

export default function(tag) {
    return document.createElement(tag);
}

export function id(tag) {
    return document.getElementById(tag);
}

HTMLElement.prototype.c = HTMLElement.prototype.getElementsByClassName;
HTMLElement.prototype.q = HTMLElement.prototype.querySelector;
HTMLElement.prototype.qa = HTMLElement.prototype.querySelectorAll;
HTMLElement.prototype.scrollToEl = function(el, focus=true) {
    // demented special-case logic to handle different list styles
    const m = getComputedStyle(el).margin;
    const i = m?.indexOf("px");
    if (i && i !== -1) this.scrollTop = el.offsetTop + 1 - m.slice(0, i);
    else this.scrollTop = el.offsetTop;
    if (focus) el.focus();
};

export function handleHold(el, onHold, onClick, t=500, needsPress=false) {
    let downTime = 0;
    let triggered = false;
    let timeout;
    el.addEventListener("pointerdown", ev => {
        ev.preventDefault();
        el.style.userSelect = "none";
        downTime = performance.now();
        if(!needsPress) timeout = setTimeout(() => {
            onHold(ev);
            triggered = true;
        }, t);
    });
    el.addEventListener("pointerup", ev => {
        ev.preventDefault()
        clearTimeout(timeout);
        const time = performance.now();
        if (needsPress) {
            if (time - downTime >= t) onHold(ev);
            else onClick?.(ev);
        } else if (!triggered) onClick?.(ev);
        triggered = false;
    });
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

export const anchor_from_link = (link, frame) => {
    return link ? frame.querySelector(`[href$="${new URL(link).pathname}"]`) : void 0;
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
