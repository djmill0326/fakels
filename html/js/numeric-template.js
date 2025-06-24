const isnumascii = (v, i, c = v.charCodeAt(i)) => c === 45 ? isnumascii(v, i + 1) : c === 46 || c > 47 && c < 58;

function take_template(v) {
    return (i, c) => {
        let numeric = "";
        let str = "";
        let j = i;
        for (; j < v.length; j++) {
            const c = v.charCodeAt(j);
            if (isnumascii(v, j)) {
                if (str.length) break;
                numeric += v[j];
            }
            else if (c === 41 || !numeric.length) break;
            else str += v[j];
        }
        if (j === i) return [j, ""];
        return [j, `\${v[${c}]}${str}`, numeric];
    };
}

function take_generic(v) {
    return i => {
        let str = "";
        let j = i;
        for (; j < v.length; j++) {
            if (isnumascii(v, j)) break;
            str += v[j];
        }
        return [j, str];
    }
}

export default function template(v) {
    let template = "return (...v) => `";
    const get_var = take_template(v);
    const generic = take_generic(v);
    const defaults = [];
    const add = ([i, x, d]) => {
        template += x;
        if (d) defaults.push(d);
        return i;
    };
    for (let i = 0; i < v.length;) {
        i = add(get_var(i, defaults.length));
        i = add(generic(i));
    }
    template += '`';
    return { compile: new Function(template)(), defaults };
}