import { get_info } from "./find.js";
import types from "./mediatype.js";
export default function shuffler(frame) {
    let dir, prev, list, cursor;
    const provider = {
        shuffle() {
            const active_dir = frame.children[0].textContent;
            if (dir !== active_dir || cursor < 0) provider.reset();
            if (list.length < 2) return list[0]?.firstElementChild;
            dir = active_dir;
            const i = Math.round(Math.random() * cursor);
            const selection = list[i];
            list[i] = list[cursor--];
            const link = selection.firstElementChild.href;
            if (link === prev) provider.shuffle();
            prev = link;
            return selection.firstElementChild;
        }, 
        reset() {
            list = Array.from(frame.children[1].children).filter(e => types[get_info(e.firstElementChild.href).ext] && !e.classList.contains("hidden"));
            cursor = list.length - 1;
        } 
    };
    return provider;
}
