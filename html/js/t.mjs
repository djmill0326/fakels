export function isNumber(x) {
    let i = 0;
    let decimal = false;
    let num = false;
    i += x[0] === "-";
    for (; i < x.length; i++) {
        const c = x[i];
        if (c === "." && !decimal) {
            decimal = true;
            continue;
        }
        if (c < '0' || c > '9') return false;
        num = true;
    }
    return num;
}
