export const search = {
    fresh: true,
    active: false,
    term: "",
    reset: () => {}
};

function iter(frame, f) {
    for (const li of frame.lastElementChild.children) f(li);
}

function clear(frame) {
    if (search.fresh) return;
    iter(frame, li => li.classList.remove("hidden"));
    search.fresh = true;
    if (window.shuffle) shuffle.reset();
}

function check(str, term) {
    if (typeof term === "string") return str.includes(term);
    return term.every(w => str.includes(w));
}

function split(term) {
    return term.split(" ")
        .map(w => w.trim())
        .filter(w => w.length);
}

function filter(frame, term, loose, useLinks) {
    term = term.toLowerCase();
    if (useLinks) term = loose 
        ? split(term).map(encodeURI)
        : encodeURI(term);
    else if (loose) term = split(term);
    iter(frame, li => {
        const a = li.firstElementChild;
        const str = useLinks ? a.href : a.innerText;
        if (check(str.toLowerCase(), term))
            li.classList.remove("hidden");
        else li.classList.add("hidden");
    });
}

let hidden = false;

function update(frame, value, useLinks) {
    const loose = value.charAt(1 + hidden) === "~";
    const term = search.term = value.slice(1 + loose + hidden);
    if (!term.length) return clear(frame);
    filter(frame, term, loose, useLinks);
    search.active = !hidden;
    search.term = term;
    search.fresh = false;
    if (window.shuffle) shuffle.reset();
}

function reset(frame) {
    clear(frame);
    search.active = false;
    search.term = "";
}

export function useSearch(input, frame) {
    input.addEventListener("input", () => {
        const value = input.value;
        if (value.charAt(0) === "!") hidden = true;
        const spec = value.charAt(hidden);
        switch (spec) {
            case ":":
                return update(frame, value, false);
            case ";":
                return update(frame, value, true);
            default:
                reset(frame);
        }
    });
    search.reset = () => reset(frame);
}
