export const search = {
    fresh: true,
    active: false,
    term: "",
    reset: () => {}
};

function clear(callback) {
    if (search.fresh) return;
    search.fresh = true;
    callback();
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

function filter(callback, term, loose, useLinks) {
    term = term.toLowerCase();
    const query = parse(term, loose);
    search.check = a => {
        return query.every(([term, tag]) => check((tag 
            ? a.dataset[tag] 
            : useLinks 
                ? a.href 
                : a.dataset.name 
                    ? a.dataset.name 
                    : a.textContent
        )?.toLowerCase(), term));
    };
    callback();
}

let hidden = false;

function update(callback, value, useLinks) {
    const loose = value.charAt(1 + hidden) === "~";
    const term = search.term = value.slice(1 + loose + hidden);
    if (!term.length) return clear(callback);
    search.active = !hidden;
    search.term = term;
    search.fresh = false;
    filter(callback, term, loose, useLinks);
}

function reset(callback) {
    search.active = false;
    search.term = "";
    clear(callback);
}

export function useSearch(input, callback) {
    input.addEventListener("input", () => {
        const value = input.value;
        hidden = value.charAt(0) === "!";
        const spec = value.charAt(hidden);
        switch (spec) {
            case ":":
                return update(callback, value, false);
            case ";":
                return update(callback, value, true);
            default:
                reset(callback);
        }
    });
    search.reset = () => reset(callback);
}
