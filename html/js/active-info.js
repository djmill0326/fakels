export function sme(shortcut_ui, mel) {
    let interval;
    const sleep = (long=true) => interval = interval ?? setInterval(() => {
        if (!shortcut_ui.isConnected) return;
        clearInterval(interval);
        interval = null;
        tick();
    }, long ? 1000 : 100);
    const playback = shortcut_ui.children[1].children[1]
    let prev = mel.paused;
    const tick = () => requestIdleCallback(() => {
        if (!shortcut_ui.isConnected) return sleep();
        if (mel.paused === prev) return sleep(false);
        playback.innerText = mel.paused ? "Resume playback" : "Pause session";
        prev = mel.paused, tick();
    });
    tick();
    const shuffle = shortcut_ui.children[4].children[1];
    return {
        shuffleHook() {
            shuffle.innerText = `Shuffle ${localStorage.shuffling === "true" ? "on" : "off"}`;
        }
    }
}