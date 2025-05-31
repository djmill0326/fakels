export default function(tag) {
    return document.createElement(tag);
}

export function id(tag) {
    return document.getElementById(tag)
}


HTMLElement.prototype.c = HTMLElement.prototype.getElementsByClassName;
HTMLElement.prototype.q = HTMLElement.prototype.querySelector;
HTMLElement.prototype.qa = HTMLElement.prototype.querySelectorAll;