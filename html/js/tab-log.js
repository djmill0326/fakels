window.addEventListener("error", ev => 
    error(ev.error.stack ?? `Error: ${ev.message}\n    at line ${ev.lineno}:${ev.colno} of ${ev.filename}`)
);

window.addEventListener("unhandledrejection", ev => 
    error(ev.reason.stack ?? `${ev.type}: ${ev.reason}`)
);

function uuidv4() {
    const buf = new Uint32Array(4);
    crypto.getRandomValues(buf);
    const a = (buf[0] >>> 0).toString(16);
    const b = ((buf[1] >>> 0) & 0xFFFF).toString(16);
    const c = ((buf[1] >>> 16) & 0x0FFF | 0x4000).toString(16);
    const d = ((buf[2] >>> 0) & 0x3FFF | 0x8000).toString(16);
    const e = (buf[2] >>> 16).toString(16) + (buf[3] >>> 0).toString(16);
    return `${a}-${b}-${c}-${d}-${e}`;
}

const id = uuidv4();
let channel = new BroadcastChannel("tab-log");

window.addEventListener("beforeunload", () => {
    if (!channel) return;
    channel.postMessage({ type: "exit", id });
    channel.close();
    channel = null;
});

function serializeFunc(root, output) {
    const text = root.toString();
    output.async = text.startsWith("async");
    output.name = root.name;
    output.$$func = text;
}

const str = (v) => 
    v === undefined ? "%undefined%" : 
    (typeof v === "number" || typeof v === "boolean" || v === null) ? v : 
    String(v);
const ignoredProperties = new Set(["outerHTML", "innerHTML", "textContent", "innerText", "outerText"]);
function safeObject(object) {
    if (!(typeof object === "object" || typeof object === "function") || object == null) return str(object);
    const refs = new Map();
    let i = 0;
    const iter = (root, skipEmptyStrings=false) => {
        const isArray = Array.isArray(root);
        const output = Array.isArray(root) ? [] : {};
        refs.set(root, output);
        if (typeof root === "function") {
            serializeFunc(root, output);
            return output;
        }
        const isElement = root instanceof Element;
        let index = 0;
        const arrayAppend = (k, v, f) => {
            if (isArray) {
                const i = parseInt(k);
                if (!isNaN(i)) {
                    const skip = i - index - 1;
                    if (skip > 0) output.push({ $$skip: skip });
                    output.push(f(v));
                    index = i;
                    return true;
                }
            }
        };
        for (const k in root) {
            const v = root[k];
            if (!isArray && (v == null ||
                (isElement && ignoredProperties.has(k)) ||
                (skipEmptyStrings && typeof v === "string" && !v)
            )) continue;
            if (typeof v !== "object" && typeof v !== "function") {
                if (!arrayAppend(k, v, str))
                    output[k] = str(v);
                continue;
            }
            const ref = refs.get(v);
            if (ref) {
                if (!ref.$ref) ref.$ref = ++i;
                const o = { $$ref: ref.$ref };
                if (!arrayAppend(k, o, x => x))
                    output[k] = { $$ref: ref.$ref };
                continue;
            } 
            if (!arrayAppend(k, v, iter))
                output[k] = iter(v, isElement && k === "style");
        }
        return output;
    }
    return iter(object);
}

function getLine(data) {
    return JSON.stringify(data.map(safeObject));
}

function sendLog(level, data) {
    if (!channel) channel = new BroadcastChannel("tab-log");
    const text = getLine(data);
    channel.postMessage({
        type: "log",
        level, 
        text, 
        time: new Date().toLocaleTimeString()
    });
}

function sendLocalLog(level, data) {
    appendMessage({
        level, 
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
    "object": "#ccc",
    "string": "#fff",
    "boolean": "thistle",
    "number": "palevioletred",
    "null": "lemonchiffon",
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

function dataDisplay(data, expand=false, refs) {
    const display = document.createElement("span");
    if (data === "%undefined%") data = undefined;
    if (refs || typeof data !== "string")
        display.style.color = typeColors[data == null ? "null" : typeof data];
    if (data == null || typeof data !== "object") {
        display.textContent = String(data);
        return display;
    }
    refs ??= findRefs(data);
    display.onclick = (ev) => {
        ev.stopPropagation();
        display.replaceWith(dataDisplay(data, !expand, refs));
    }
    if (data.$$func) {
        const tag = document.createElement("span");
        tag.style.color = "aquamarine";
        tag.textContent = data.async ? "async ƒ " : "ƒ ";
        const name = document.createElement("span");
        name.style.color = "mediumaquamarine";
        name.textContent = data.name || "anonymous";
        display.style.color = typeColors.string;
        display.append(tag, name);
        if (expand) {
            const wrapper = document.createElement("div");
            wrapper.style.marginLeft = "1em";
            wrapper.textContent = data.$$func;
            display.append(wrapper);
        }
        return display;
    }
    const isArray = Array.isArray(data);
    const tag = isArray ? ["[", "]"] : ["{", "}"];
    if (!expand) {
        display.append(`${tag[0]} ... ${tag[1]}`);
        return display;
    }
    display.append(tag[0]);
    for (const k in data) {
        if (k === "$ref") continue;
        const v = data[k];
        const wrapper = document.createElement("div");
        wrapper.style.marginLeft = "1em";
        if (isArray) {
            const skip = v?.$$skip;
            if (skip) {
                wrapper.append(skip === 1 ? `(empty)` : `(empty x ${skip})`);
                display.append(wrapper);
                continue;
            }
        }
        const ref = v?.$$ref;
        const value = dataDisplay(typeof v === "string" && v !== "%undefined%" ? `"${v}"` : ref ? refs.get(ref) : v, false, refs);
        if(isArray) wrapper.append(value, ", ") 
        else wrapper.append(`${k}: `, value, ", ");
        display.append(wrapper);
    }
    if (display.children.length > 1) display.lastChild.lastChild.remove();
    display.append(tag[1]);
    return display;
}

const updateHandles = (handles) => {
    if (!document.querySelector(".message-bar")) {
        const bar = document.createElement("footer");
        bar.className = "message-bar";
        bar.style.position = "sticky";
        bar.style.bottom = "0px";
        bar.style.display = "flex";
        bar.style.gap = "5px";
        const selector = document.createElement("select");
        selector.className = "message-select";
        selector.style.width = "80px";
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Send command to eval";
        input.style.flexGrow = 1;
        input.style.fontFamily = "monospace";
        input.style.fontSize = "10px";
        input.enterKeyHint = "enter";
        input.onkeydown = ev => {
            if (ev.key === "Enter" && input.value && selector.value) {
                channel.postMessage({
                    type: "eval",
                    id: selector.value,
                    text: input.value
                });
                sendLocalLog("eval", [input.value]);
                input.value = "";
            }
        };
        bar.append(input, selector);
        document.body.append(bar);
    }
    const selector = document.querySelector(".message-select");
    selector.replaceChildren(...Array.from(handles.entries()).map(([id, name]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${name} (${id})`;
        return option;
    }));
};

const roots = [];
const appendMessage = (data) => {
    const line = document.createElement("div");
    const time = document.createElement("span");
    const text = document.createElement("span");
    line.className = data.level;
    time.className = "time";
    time.textContent = data.time;
    text.append(...JSON.parse(data.text).flatMap(v => [dataDisplay(v), " "]));
    text.lastChild?.remove();
    line.append(time, text);

    roots.forEach((root, i) => {
        const scrolled = root.scrollHeight - root.scrollTop - root.clientHeight < 10; 
        root.append(i ? line.cloneNode(true) : line);
        if (scrolled) root.scrollTop = root.scrollHeight;
    });
};

let observer;
function init() {
    observer = new ResizeObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            const prevHeight = el._prevHeight;
            const height = el.clientHeight;
            if (prevHeight > height && el.scrollHeight - el.scrollTop - prevHeight < 10)
                el.scrollTop = el.scrollHeight;
            el._prevHeight = height;
        });
    });
    const handles = new Map();
    updateHandles(handles);
    channel.addEventListener("message", ev => {
        if (ev.data.type === "new") {
            if (handles.has(ev.data.id)) return;
            handles.set(ev.data.id, ev.data.name);
            updateHandles(handles);
        } else if (ev.data.type === "exit") {
            handles.delete(ev.data.id);
            updateHandles(handles);
        } else if (ev.data.type === "log") appendMessage(ev.data);
    });
    channel.postMessage({ type: "notify" });
}

export function enableLog(root = document.body) {
    if (!roots.length) init();
    roots.push(root);
    observer.observe(root);
}

export function overrideConsole(name = "unknown", evaluator=eval) {
    console.log = log;
    console.warn = warn;
    console.error = error;
    console.info = info;
    console.debug = debug;
    channel.postMessage({ type: "new", id, name });
    channel.addEventListener("message", (ev) => {
        if (ev.data.type === "eval" && ev.data.id === id)
            sendLog("eval-result", [evaluator(ev.data.text)]);
        else if (ev.data.type === "notify")
            channel.postMessage({ type: "new", id, name });
    });
}

export default log;
