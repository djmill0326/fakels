const channel = new BroadcastChannel("tab-log");
window.addEventListener("beforeunload", () => channel.close());

function getLine(data) {
    return data.map(
        x => typeof x === "object"
            ? JSON.stringify(x, null, 2)
            : String(x)
    ).join(" ");
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

export function enableLog(root = document.body) {
    channel.addEventListener("message", ev => {
        const line = document.createElement("div");
        const time = document.createElement("span");
        const text = document.createElement("span");
        line.className = ev.data.type;
        time.className = "time";
        time.textContent = ev.data.time;
        text.textContent = ev.data.text;
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
    error(`${ev.type}: ${ev.message}\n  at line ${ev.lineno}:${ev.colno} of ${ev.filename}`)
);

window.addEventListener("unhandledrejection", ev => 
    error(`${ev.type}: ${ev.reason}`)
);
