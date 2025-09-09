function buildTree(terms) {
    const root = {};
    for (const term of terms) {
        let node = root;
        for (const ch of term) {
            node[ch] ??= {};
            node = node[ch];
        }
        node.$ = term;
    }
    return root;
}
function search(str, terms) {
    const tree = buildTree(terms);
    const toMatch = new Set(terms);
    let active = [];
    for (const ch of str) {
        const matches = [];
        function update(next) {
            if (next) {
                matches.push(next); 
                if (next.$) toMatch.delete(next.$);
            }
        }
        for (const match of active) update(match[ch]);
        update(tree[ch]);
        active = matches;
    }
    return toMatch; //for debugging
}
const str = "ushers";
const terms = ["he", "her", "hers"];
console.log(search(str, terms));
