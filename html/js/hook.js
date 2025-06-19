const loc = location.origin + "/50x.html";
let interval;
const getheaders = (invalidate_time=3000) => new Promise((resolve, reject) => {
    // using XMLHttpRequest because it feels retro
    const req = new XMLHttpRequest();
    req.onload = () => {
        const headers = {};
        req.getAllResponseHeaders().split("\r\n").forEach(x => {
            const [k, v] = x.split(": ");
            headers[k] = v;
        })
        resolve(headers);
    }
    req.onerror = req.onabort = err => reject(err);
    req.open('GET', loc, true);
    req.send(null);
    if (invalidate_time && !interval) interval = setInterval(() => window.headers = null, invalidate_time);
});

export const getheader = async name => {
    if (window.headers) return window.headers[name];
    else return (window.headers = await getheaders())[name];
};

const query_cache = new Map();
export async function api(endpoint, query, frame, cb, req, err, cached=false) {
    let link = `${endpoint}%20${query}`;
    let response, wait = true;
    const callback = data => {
        if (cached) query_cache.set(link, data);
        if (frame) frame.innerHTML = data;
        wait = false;
        if (req) {
            req.list.delete(req.name);
            req.update();
        }
        if(cb) cb(data);
    };
    if (cached) {
        const data = query_cache.get(link);
        if (data) return callback(data);
    }
    if (query === "/link/") {
        if (!window.rpc) window.rpc = await import("./rpc_base.js");
        const link_code = document.createElement("code");
        link_code.innerHTML = "Check your browser's inspector console for the link ID!<br>Navigate to /rpc.html, then enter link code in input.";
        window.popup?.apply({}, [link_code, "Link code:"]);
        const term = document.getElementById("term");
        const text = document.querySelector("b")?.textContent ?? "";
        localStorage.llocation = term.value = text === "/" ? "" : text;
        requestIdleCallback(() => term.nextElementSibling.click());
    }
    if (req) {
        req.list.add(req.name);
        req.update();
    }
    setTimeout(() => {
        if (wait && frame) frame.innerHTML = `<h3 style="color: #000">&nbsp;... &nbsp;${query}</h3>`;
    }, 200);
    const timeout = () => {
        if (response) return;
        const failure = `${req.name} failed`;
        if (req) {
            req.list.delete(req.name);
            req.list.add(failure);
            req.update();
            setTimeout(() => {
                req.list.delete(failure);
                req.update();
            }, 1000);
        }
        if (err) err();
        return true;
    };
    setTimeout(timeout, 10000);
    response = await fetch(`http://${location.hostname}:${await getheader("adapter-port")}/${link}`).catch(err => console.warn(err));
    if (timeout()) return;
    callback(await response.text());
};

export const main = (client=true) => {
    if (client) { window.is_client = true; }
    let main;
    if (main = document.getElementById("dyn")) {} else {
        main = document.createElement("div");
        main.id = "dyn";
        document.body.append(main);
    }
    requestIdleCallback(() => document.body.style.visibility = "visible");
    return main;
};