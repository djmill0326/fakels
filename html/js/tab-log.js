window.addEventListener("error", ev => 
    error(ev.error.stack ?? `Error: ${ev.message}\n    at line ${ev.lineno}:${ev.colno} of ${ev.filename}`)
);

window.addEventListener("unhandledrejection", ev => 
    error(ev.reason.stack ?? `${ev.type}: ${ev.reason}`)
);
function getId() {
    const buf = new Uint32Array(4);
    crypto.getRandomValues(buf);
    const a = (buf[0] >>> 0).toString(16);
    const b = ((buf[1] >>> 0) & 0xFFFF).toString(16);
    const c = ((buf[1] >>> 16) & 0x0FFF | 0x4000).toString(16);
    const d = ((buf[2] >>> 0) & 0x3FFF | 0xB000).toString(16);
    const e = (buf[2] >>> 16).toString(16) + (buf[3] >>> 0).toString(16);
    return `${a}-${b}-${c}-${d}-${e}`;
}

const id = getId();
let channel = new BroadcastChannel("tab-log");

window.addEventListener("beforeunload", () => {
    if (!channel) return;
    channel.postMessage({ type: "exit", id });
    channel.close();
    channel = null;
});


const ignoredProperties = new Set(["outerHTML", "innerHTML", "textContent", "innerText", "outerText"]);
function safeObject(object) {
    const str = (v) => (typeof v === "number" || typeof v === "boolean" || v == null) ? v : v.toString();
    if (typeof object !== "object") return str(object);
    const refs = new Map();
    const output = {};
    let i = 0;
    const iter = (root, output, skipEmptyStrings=false) => {
        refs.set(root, 0);
        const isElement = root instanceof Element;
        for (const k in root) {
            const v = root[k];
            if (v == null ||
                (isElement && ignoredProperties.has(k)) ||
                (skipEmptyStrings && typeof v === "string" && !v)
            ) continue;
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
            iter(v, output[k], k === "style" && isElement); 
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

function sendLog(level, data) {
    if (!channel) channel = new BroadcastChannel("tab-log");
    channel.postMessage({
        type: "log",
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

function dataDisplay(data, expand=false, refs) {
    const display = document.createElement("span");
    if (refs || typeof data !== "string")
        display.style.color = typeColors[typeof data];
    if (typeof data !== "object" || data == null) {
        display.textContent = data;
        return display;
    }
    refs ??= findRefs(data);
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
        selector.onchange = () => alert(selector.value);
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Send command to eval";
        input.style.flexGrow = 1;
        input.style.fontFamily = "monospace";
        input.style.fontSize = "10px";
        input.onkeydown = ev => {
            if (ev.key === "Enter" && input.value && selector.value) {
                channel.postMessage({
                    type: "eval",
                    id: selector.value,
                    text: input.value
                });
                input.value = "";
            }
        };
        bar.append(selector, input);
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

export function enableLog(root = document.body) {
    const handles = new Map();
    updateHandles(handles);
    channel.addEventListener("message", ev => {
        if (ev.data.type === "new") {
            handles.set(ev.data.id, ev.data.name);
            updateHandles(handles);
        } else if (ev.data.type === "exit") {
            handles.delete(ev.data.id);
            updateHandles(handles);
        }
        if (ev.data.type !== "log") return;
        const line = document.createElement("div");
        const time = document.createElement("span");
        const text = document.createElement("span");
        line.className = ev.data.level;
        time.className = "time";
        time.textContent = ev.data.time;
        text.append(...JSON.parse(ev.data.text).flatMap(v => [dataDisplay(v), " "]));
        text.lastChild?.remove();
        line.append(time, text);

        const scrolled = root.scrollHeight - root.scrollTop - root.clientHeight < 10; 
        root.append(line);
        if (scrolled) root.scrollTop = root.scrollHeight;
    });
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
            log(evaluator(ev.data.text));
    });
}

export default log;
