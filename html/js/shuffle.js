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

export default function shuffler(items) {
    let dir, prev, peeked, list, cursor, dirty;
    const provider = {
        peek() {
            const active_dir = location.pathname + items.length;
            if (dirty || dir !== active_dir) {
                dir = active_dir;
                this.reset();
            }
            else if (cursor < 0) cursor = list.length - 1;
            if (peeked != null) return items[list[peeked]].firstElementChild;
            if (list.length < 2) return list[0];
            // const i = Math.floor(Math.random() * (cursor + 1));
            const i = secureShuffleIndex(cursor);
            peeked = i;
            const selection = list[i];
            if (selection === prev || !types[get_info(items[selection].firstElementChild.href).ext]) {
                this.consume();
                return this.peek();
            }
            prev = selection;
            return items[selection].firstElementChild;
        },
        consume() {
            const result = this.peek();
            const selection = list[peeked];
            list[peeked] = list[cursor];
            list[cursor--] = selection;
            peeked = null;
            return result;
        }, 
        reset() {
            list = new Array(items.length).fill().map((_, i) => i);
            cursor = list.length - 1;
            peeked = null;
            dirty = false;
        },
        invalidate() {
            dirty = true;
        }
    };
    return provider;
}
