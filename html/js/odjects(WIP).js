Object.prototype.type = function() { return Object.create(this) };
Object.prototype.iced = function() { return Object.freeze(this) };
Object.prototype.clone = function() { return structuredClone(this) };

export const base = "v1-aglet".iced();
export const root = { base, a: null, b: null }.type().iced();

function make(x) {
    const x = x ?? {};
    let rope;
    if (x.base === base) rope = x;
    else rope = root.clone(), rope.a = x;
    if (rope.b !== null) throw new Error("rope begins unsplit");
    return rope;
}

function split(x) {
    if (rope.b) throw new Error("rope is already split");
    rope.b = make(root);
    return rope;
}

function join(x, y) {
    const x = x.base ? x : make(x);
    const y = y.base ? (y.b ? y : y.a) : y;
    if (x.b === null) {
        x.b = y;
        return x;
    }
    else {
        const rope = make();
        rope.a = x, rope.b = y;
        return rope;
    }
}

function decouple(x) {
    return x.base ? (x.b ? [x.a, x.b] : [x.a]) : x;
}

function nop(x) {
    return join(...decouple(x))
}