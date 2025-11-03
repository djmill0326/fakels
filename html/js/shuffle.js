import { get_info } from "./find.js";
import types from "./mediatype.mjs";

// very important function provided by Microsoft Copilot
function secureShuffleIndex(max) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % (max + 1);
}

export default function shuffler(frame) {
    let dir, prev, list, cursor;
    const provider = {
        shuffle() {
            const active_dir = frame.children[0].textContent;
            if (dir !== active_dir) provider.reset();
            else if (cursor < 0) cursor = list.length - 1;
            if (list.length < 2) return 0;
            dir = active_dir;
            // const i = Math.floor(Math.random() * (cursor + 1));
            const i = secureShuffleIndex(cursor);
            const selection = list[i];
            if (selection === prev) return provider.shuffle();
            prev = selection;
            list[i] = list[cursor];
            list[cursor--] = selection;
            return selection;
        }, 
        reset() {
            list = [];
            const ch = frame.children[1].children;
            for (let i = 0; i < ch.length; i++) {
                const e = ch[i];
                if (types[get_info(e.firstElementChild.href).ext]
                    && !e.classList.contains("hidden")
                ) list.push(i);
            }
            cursor = list.length - 1;
        } 
    };
    return provider;
}
