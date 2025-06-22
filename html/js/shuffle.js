import { get_info } from "./find.js";
import types from "./mediatype.js";
export default function shuffler() {
    const swapped = new Set();
    let previous_root;
    const provider = { 
        shuffle(a, f=frame) {
            if (a.parentElement.parentElement !== previous_root) swapped.clear();
            previous_root = a.parentElement.parentElement;
            const list = Array.from(f.children[1].children).filter(e => types[get_info(e.firstElementChild.href).ext]);
            let i = 0;
            const select = (j=0) => {
                if (j === list.length - 1) return i = null;
                const swap = Math.round(Math.random() * (list.length - 1));
                if (/*swap === j || */swapped.has(swap)) return () => select(j + 1);
                const tmp = list[j];
                list[j] = list[swap];
                list[swap] = tmp;
                swapped.add(swap);
                i = j;
            };
            for(let output = select(); typeof output === "function"; output = output());
            return i === null ? void 0 : list[i].firstElementChild;
        }, 
        swapped 
    };
    return provider;
}