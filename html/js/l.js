export const _ = localStorage;

export default function(tag) {
    return document.createElement(tag);
}

export function id(tag) {
    return document.getElementById(tag)
}

HTMLElement.prototype.c = HTMLElement.prototype.getElementsByClassName;
HTMLElement.prototype.q = HTMLElement.prototype.querySelector;
HTMLElement.prototype.qa = HTMLElement.prototype.querySelectorAll;
HTMLElement.prototype.scrollToEl = function(el) {
    // demented special-case logic to handle different list styles
    const m = getComputedStyle(el).margin;
    const i = m?.indexOf("px");
    if (i && i !== -1) this.scrollTop = el.offsetTop + 1 - m.slice(0, i);
    else this.scrollTop = el.offsetTop;
};