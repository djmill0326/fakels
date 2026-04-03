function stupidRand(max) {
    if (max === 0) return 0;
    const getDigit = () => Math.random().toString().at(-2);
    const x = parseInt(new Array(Math.ceil(Math.log10(max + 1))).fill().map(getDigit).join(""));
    if (x > max) return stupidRand(max);
    return x;
}

export default function shuffler(items) {
    let dir, prev, peeked, list, cursor, dirty, inverseMap;
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
            let selection, success = false;
            for (let i = 0; i < items.length; i++) {
                const i = Math.floor(Math.random() * (cursor + 1));
                // const i = stupidRand(cursor);
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
        consume(index) {
            if (!list) this.reset();
            let result, selection;
            if (index != null) {
                result = items[index];
                selection = index;
                peeked = inverseMap[index];
                if (peeked > cursor) return;
            } else {
                result = this.peek();
                selection = list[peeked];
            }
            inverseMap[selection] = cursor;
            inverseMap[list[cursor]] = peeked;
            list[peeked] = list[cursor];
            list[cursor--] = selection;
            peeked = null;
            if (cursor < 0) cursor = list.length - 1;
            return result;
        }, 
        reset() {
            list = new Array(items.length);
            for (let i = 0; i < items.length; i++) list[i] = i;
            inverseMap = [...list];
            window.list = list;
            window.inverseMap = inverseMap;
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
