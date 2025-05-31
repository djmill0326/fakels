import "/socket.io/socket.io.js";
export let client, socket = io();
const input = document.getElementById("term");
socket.on("rpc", ({ event, data }) => {
    console.log("[rpc/call]", event, data);
    if (event === "link") {
        client = data;
        socket.emit("rpc", { client, event: "browse", data: input.value });
    }
    if (event === "select") {
        window.navigate(frame.children[1].children[parseInt(data)].firstElementChild);
    }
    if (event === "browse") {
        term.value = data;
        btn.click();
    }
});
socket.on("connect", () => {
    console.log("[rpc/link-id]", socket.id);
});