const { fork } = require("child_process");

const cd = '\u001b[3';
const cl = '\u001b[9';
const cr = '\u001b[39m';

const dir = process.cwd();
console.info(`Starting Manager. Serving from ${dir}...`);
let binding = "";
const run = () => {
    const p = fork("../../../Root/adapter.js", [binding]);
    p.on("spawn", () => p.send("Hello, Adapter."));
    p.on("exit", () => setTimeout(run, 50));
    p.on("message", data => {
        console.log(`[${cd}3mAdapter${cr}]`, data);
        const cmd = data.split(":");
        if (cmd.length === 1) return;
        switch (cmd[0]) {
            case "setport":
                p.send("newport:" + parseInt(cmd[1]))
                break;
            case "rebind":
                p.send("Rebind requested. Restarting server...");
                const bind = cmd[1];
                if (bind[0] === "/") binding = bind.slice(1);
                else binding = bind;
                setTimeout(() => p.kill(9), 50);
                break;
            default:
                console.warn("^invalid command");
        }
    });
};
queueMicrotask(run);