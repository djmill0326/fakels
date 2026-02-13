import { get_info } from "./find.js";
import types from "./mediatype.mjs";

function stupidRand(max) {
    if (max === 0) return 0;
    const getDigit = () => Math.random().toString().at(-2);
    const x = parseInt(new Array(Math.ceil(Math.log10(max + 1))).fill().map(getDigit).join(""));
    if (x > max) return stupidRand(max);
    return x;
}

export default function shuffler(items) {
    let dir, prev, peeked, list, cursor, dirty;
    const isValid = (selection) => items[selection].isMedia;
    const provider = {
        peek() {
            const active_dir = location.pathname + items.length;
            if (dirty || dir !== active_dir) {
                dir = active_dir;
                this.reset();
            }
            if (peeked != null) return items[list[peeked]];
            if (list.length < 2) return isValid(0) && items[0];
            // const i = Math.floor(Math.random() * (cursor + 1));
            let selection, success = false;
            for (let i = 0; i < items.length; i++) {
                const i = stupidRand(cursor);
                peeked = i;
                selection = list[i];
                if (selection !== prev && isValid(selection)) {
                    success = true;
                    break;
                }
                this.consume();
            }
            if (!success) return;
            prev = selection;
            return items[selection];
        },
        consume() {
            const result = this.peek();
            const selection = list[peeked];
            list[peeked] = list[cursor];
            list[cursor--] = selection;
            peeked = null;
            if (cursor < 0) cursor = list.length - 1;
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
