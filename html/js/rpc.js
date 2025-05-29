import { dynamic_main, query_fetch, getheader } from "./hook.js";

const init_port = await getheader("adapter-port");
console.warn("detected adapter port:", init_port);

let client, socket;
fetch(`${location.origin}/socket.io/socket.io.js`).then(res => res.text()).then(data => {
    eval(data);
    socket = window.socket = io();
    socket.on("rpc", ({ event, data }) => {
        if (event === "browse") {
            query = data;
            term.value = query;
            back.disabled = false;
            back.checked = query.replace("/", "").length;
            query_fetch("ls", query, frame, null);
        }
    });
});

const form = dynamic_main();
const { back, term } = form.children;

const frame = document.getElementById("frame");
let query;

back.onclick = () => {
    const remaining = query.split("/").slice(1, -1);
    if (remaining.pop()) socket.emit("rpc", { client, event: "browse", data: remaining.join("/") });
    else back.checked = false;
};

form.onsubmit = (e) => {
    e.preventDefault();
    if (!client) {
        client = term.value;
        if (socket) socket.emit("rpc", { event: "link", data: client });
        term.disabled = true;
        return;
    }
};

frame.onclick = (e) => {
    e.preventDefault();
    const c = e.target.children;
    const u = (l) => {
        const list = frame.querySelectorAll("ul > li > a");
        if (socket) socket.emit("rpc", { client, event: "select", data: Array.prototype.indexOf.call(list, l) })
    };
    if (e.target.href) u(e.target);
    if (c.length && c[0].href) u(c[0]);
};

window.addEventListener("keypress", ev => {
    if (ev.key === "b") back.click();
});