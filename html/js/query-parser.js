function parseTerm(str, s, parent) {
    let buf = "";
    while (s.i < str.length) {
        const c = str[s.i];
        if (c === ";" || c === "|" || c === ")") break;
        if (c === "\\" && str.length - s.i > 1) {
            buf += str[s.i + 1];
            s.i += 2;
            continue;
        }
        s.i++;
        buf += c;
    }
    buf = buf.trim();
    if (!buf) return;
    const invert = buf[0] === "!" && buf.length > 1;
    const result = { type: "term", str: invert ? buf.slice(1).trim() : buf, invert };
    parent?.push(result);
    return result;
}

function detectGroup(str, s) {
    let i = s.i;
    while (str[i] === " ") i++;
    const invert = str[i] === "!";
    i += invert;
    while (str[i] === " ") i++;
    if (str[i++] === "(") {
        s.i = i;
        return [true, invert];
    }
    return [];
}

function parseTagged(str, s, parent) {
    let buf = "", term;
    while (s.i < str.length) {
        const c = str[s.i];
        if (c === ";" || c === "|" || c === ")") break;
        if (c === "\\" && str.length - s.i > 1) {
            buf += str[s.i + 1];
            s.i += 2;
            continue;
        }
        if (c === "=") {
            s.i++;
            const [isGroup, invert] = detectGroup(str, s);
            if (isGroup) term = parse(str, s, null, false, invert);
            else term = parseTerm(str, s);
            continue;
        }
        s.i++;
        buf += c;
    }
    buf = buf.trim();
    let result;
    if (term) {
        if (!buf) result = term;
        else {
            const tag = buf;
            result = term.type === "term" ? { ...term, tag } : { type: "term", tag, group: term };
        }
    } else {
        if (!buf) return;
        const invert = buf[0] === "!" && buf.length > 1;
        result = { type: "term", str: invert ? buf.slice(1).trim() : buf, invert };
    }
    parent?.push(result);
    return result;
}

export default function parse(str, s, parent, acceptTag=true, invert=false) {
    s ??= { i: 0 };
    const output = [];
    let group = [];
    const commit = () => {
        if (group.length > 1) output.push({ type: "or", group });
        else if (group.length) output.push(group[0]);
        group = [];
    };
    while (s.i < str.length) {
        if (str[s.i] === ")") {
            s.i++;
            break;
        }
        const [isGroup, invert] = detectGroup(str, s);
        if (isGroup) {
            parse(str, s, group, acceptTag, invert);
            continue;
        }
        if (acceptTag) parseTagged(str, s, group);
        else parseTerm(str, s, group);
        if (str[s.i] === ";") { 
            commit();
            s.i++;
        }
        if (str[s.i] === "|") s.i++;
    }
    commit();
    const result = output.length < 2 ? output[0] : { type: "and", group: output };
    if (!result) return;
    result.invert = !!(invert ^ result.invert);
    parent?.push(result);
    return result;
}
