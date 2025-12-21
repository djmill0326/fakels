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
    number(frame);
    search.fresh = true;
    if (window.shuffle) shuffle.reset();
}

function check(str, term) {
    if (!str) return;
    if (typeof term === "string") return str.includes(term);
    return term.every(w => str.includes(w));
}

function split(term) {
    return term.split(/\s+/);
}

function parse(term, loose, useLinks) {
    return term.split(";").map(x => {
        if (!x) return;
        const i = x.indexOf("=");
        if (i === -1) return [useLinks 
            ? loose ? split(x).map(encodeURI) : encodeURI(x)
            : loose ? split(x) : x
        ];
        const tag = x.slice(0, i);
        const val = x.slice(i + 1);
        if (!tag) return [x];
        if (!val) return;
        return [loose ? split(val) : val, tag];
    }).filter(Boolean);
}

function number(frame, total) {
    if (frame.firstElementChild.textContent.endsWith(" entries (flat)"))
        frame.firstElementChild.textContent = `${total ?? frame.lastElementChild.children.length} entries (flat)`;
}

function filter(frame, term, loose, useLinks) {
    term = term.toLowerCase();
    const search = parse(term, loose);
    let total = 0;
    iter(frame, li => {
        const a = li.firstElementChild;
        const result = search.every(([term, tag]) => check((tag 
            ? a.dataset[tag] 
            : useLinks 
                ? a.href 
                : a.dataset.name 
                    ? a.dataset.name 
                    : a.textContent
        )?.toLowerCase(), term));
        li.classList[result ? "remove" : "add"]("hidden");
        if (result) total++;
    });
    number(frame, total);
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
    shuffle?.invalidate();
}

function reset(frame) {
    clear(frame);
    search.active = false;
    search.term = "";
}

export function useSearch(input, frame) {
    input.addEventListener("input", () => {
        const value = input.value;
        hidden = value.charAt(0) === "!";
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
