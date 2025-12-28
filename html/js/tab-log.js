const channel = new BroadcastChannel("tab-log");
window.addEventListener("beforeunload", () => channel.close());

function safeObject(object) {
    const str = (v) => (typeof v === "number" || typeof v === "boolean") ? v : v.toString();
    if (typeof object !== "object") return str(object);
    const refs = new Map();
    const output = {};
    let i = 0;
    const iter = (root, output) => {
        refs.set(root, 0);
        for (const k in root) {
            const v = root[k];
            if (v == null) continue;
            if (typeof v !== "object") {
                output[k] = str(v);
                continue;
            }
            if (refs.has(v)) {
                let ref = refs.get(v);
                if (!ref) refs.set(v, ref = ++i);
                output[k] = { $$ref: ref };
                continue;
            }
            output[k] = {};
            iter(v, output[k]); 
        }
        const ref = refs.get(root);
        if (ref) output.$ref = ref;
    }
    iter(object, output);
    return output;
}

function getLine(data) {
    return JSON.stringify(data.map(safeObject));
}

function sendLog(type, data) {
    channel.postMessage({
        type, 
        text: getLine(data), 
        time: new Date().toLocaleTimeString()
    });
}

export const log = (...data) => sendLog("log", data);
export const warn = (...data) => sendLog("warn", data);
export const error = (...data) => sendLog("error", data);
export const info = (...data) => sendLog("info", data);
export const debug = (...data) => sendLog("debug", data);

const typeColors = {
    "string": "#ccc",
    "boolean": "thistle",
    "number": "palevioletred",
    "undefined": "lemonchiffon"
};

function findRefs(data) {
    if (typeof data !== "object") return;
    const refs = new Map();
    const iter = (root) => {
        if (typeof root !== "object") return;
        for (const k in root) {
            const v = root[k];
            if (k === "$ref") refs.set(v, root);
            else iter(v);
        }
    }
    iter(data);
    return refs;
}

function dataDisplay(data, expand=false) {
    const display = document.createElement("span");
    if (typeof data !== "object") {
        display.style.color = typeColors[typeof data];
        display.textContent = data;
        return display;
    }
    const refs = findRefs(data);
    display.onclick = (ev) => {
        ev.stopPropagation();
        display.replaceWith(dataDisplay(data, !expand));
    }
    if (!expand) {
        display.append("{ ... }");
        return display;
    }
    display.append("{");
    for (const k in data) {
        if (k === "$ref") continue;
        const v = data[k];
        const wrapper = document.createElement("div");
        wrapper.style.marginLeft = "1em";
        const ref = typeof v === "object" && v.$$ref;
        const value = dataDisplay(typeof v === "string" ? `"${v}"` : ref ? refs.get(ref) : v, false, refs);
        wrapper.append(`${k}: `, value, ", ");
        display.append(wrapper);
    }
    if (display.children.length > 1) display.lastChild.lastChild.remove();
    display.append("}");
    return display;
}

export function enableLog(root = document.body) {
    channel.addEventListener("message", ev => {
        const line = document.createElement("div");
        const time = document.createElement("span");
        const text = document.createElement("span");
        line.className = ev.data.type;
        time.className = "time";
        time.textContent = ev.data.time;
        text.append(...JSON.parse(ev.data.text).map(v => dataDisplay(v)));
        line.append(time, text);

        const scrolled = root.scrollHeight - root.scrollTop - root.clientHeight < 10; 
        root.append(line);
        if (scrolled) root.scrollTop = root.scrollHeight;
    });
}

export function overrideConsole() {
    console.log = log;
    console.warn = warn;
    console.error = error;
    console.info = info;
    console.debug = debug;
}

export default log;

window.addEventListener("error", ev => 
    alert(`${ev.type}: ${ev.message}\n  at line ${ev.lineno}:${ev.colno} of ${ev.filename}`)
);

window.addEventListener("unhandledrejection", ev => 
    error(`${ev.type}: ${ev.reason}`)
);
