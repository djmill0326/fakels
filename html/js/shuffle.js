import { get_info } from "./find.js";
import types from "./mediatype.mjs";

// very important function provided by Microsoft Copilot
function secureShuffleIndex(max) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % (max + 1);
}

function stupidRand(max) {
    if (max === 0) return 0;
    const getDigit = () => Math.random().toString().at(-2);
    const x = parseInt(new Array(Math.ceil(Math.log10(max + 1))).fill().map(getDigit).join(""));
    if (x > max) return stupidRand(max);
    return x;
}

export default function shuffler(frame) {
    let dir, prev, peeked, list, cursor, dirty;
    const provider = {
        peek() {
            const active_dir = location.pathname + frame.children[1].children.length;
            if (dirty || dir !== active_dir) {
                dir = active_dir;
                provider.reset();
            }
            else if (cursor < 0) cursor = list.length - 1;
            if (peeked !== null) return list[peeked];
            if (list.length < 2) return list[0];
            const i = Math.floor(Math.random() * (cursor + 1));
            peeked = i;
            const selection = list[i];
            if (selection === prev) {
                this.consume();
                return this.peek();
            }
            prev = selection;
            return selection;
        },
        consume() {
            const selection = this.peek();
            list[peeked] = list[cursor];
            list[cursor--] = selection;
            peeked = null;
            return selection;
        }, 
        reset() {
            list = [], peeked = null;
            const ch = frame.children[1].children;
            for (let i = 0; i < ch.length; i++) {
                const e = ch[i];
                if (types[get_info(e.firstElementChild.href).ext]
                    && !e.classList.contains("hidden")
                ) list.push(i);
            }
            cursor = list.length - 1;
        },
        invalidate() {
            dirty = true;
        }
    };
    return provider;
}
