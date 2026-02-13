import parse from "./query-parser.js";

export const search = {
    fresh: true,
    active: false,
    term: "",
    reset: () => {},
    check: () => true
};

function reset(callback) {
    if (search.fresh) return;
    search.term = "";
    search.fresh = true;
    search.check = () => true;
    callback();
}

/* function match(el, query, useLinks, tag) {
    if (!query) return true;
    let result;
    if (query.type === "and") {
        result = query.group.every(group => match(el, group, useLinks, tag));
    } else if (query.type === "or") {
        result = query.group.some(group => match(el, group, useLinks, tag));
    } else {
        tag ??= query.tag;
        if (query.group) result = match(el, query.group, useLinks, tag);
        else {
            const text = tag ? el.dataset[tag] : useLinks ? el.href : el.textContent;
            if (text) result = text.toLowerCase().includes(query.str);
            else result = false;
        }
    }
    return result ^ query.invert;
} */

function escapeRegex(str) {
    const toEscape = "+*?^$\\.[]{}()|/";
    let slash = false;
    let escaped = "";
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "\\" && !slash) {
            slash = true;
            continue;
        }
        if (toEscape.includes(c)) {
            if (slash) escaped += c;
            else escaped += `\\${c}`;
        } else {
            if (slash) escaped += `\\${c}`;
            else escaped += c;
        }
        slash = false;
    }
    if (slash) escaped += "\\\\";
    return escaped;
}

function build(query, useLinks, tag) {
    if (!query) return "true";
    const prefix = query.invert ? "!" : "";
    if (query.type === "and") return `${prefix}(${query.group.map(q => build(q, useLinks, tag)).join("&&")})`;
    if (query.type === "or") return `${prefix}(${query.group.map(q => build(q, useLinks, tag)).join("||")})`;
    tag ??= query.tag;
    if (query.group) return `${prefix}${build(query.group, useLinks, tag)}`;
    return `${prefix}((t = ${tag ? `item["${tag}"]` : useLinks ? "item.href" : "item.name"})&&/${escapeRegex(query.str)}/i.test(t))`;
}

function filter(callback, term, useLinks) {
    term = term.toLowerCase();
    const query = parse(term);
    search.check = new Function("item", `return ${build(query, useLinks)}`);
    //search.check = el => match(el, query, useLinks);
    callback();
}

function update(callback, value, useLinks) {
    const offset = 1 + search.persistent;
    const term = search.term = value.slice(offset);
    if (!term.length) return reset(callback);
    search.fresh = false;
    filter(callback, term, useLinks);
}

export function useSearch(input, callback) {
    input.addEventListener("input", () => {
        const value = input.value;
        const spec = value[0];
        search.persistent = value[1] === spec;
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
