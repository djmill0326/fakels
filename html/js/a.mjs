function test() {
    const c = new AbortController();
    const t = () => { throw "abortion" };
    c.signal.addEventListener("abort", t);
    return c;
}
try {
test().abort();
} catch (e) { console.log("caught", e); }
