/* Simple Structured Entropy Generator::sseg.mjs */

import { argv } from "process";
export const coin = Object.create(null);
Object.defineProperty(coin, "flip", { get() { return Math.random() > .5 ? "Tails" : "Heads" } });
const stats = { Heads: 0, Tails: 0 };
const arg1 = parseFloat(argv[2]) - .5;
if (!isNaN(arg1)) {
    const arg2 = parseFloat(argv[3]) - .5;
    const [x, y] = isNaN(arg2) ? [arg1] : Math.random() < .5 ? [arg1, arg2] : [arg2, arg1];
    const it = (id) => {
        const log = [];
        for (let i = 0; i < x + Math.random(); ++i) {
            const result = coin.flip;
            ++stats[result];
            const str = i.toString();
            log.push(["0".repeat(8 - str.length) + str, result, Math.random().toFixed(3), "[random float]", "\n", `stats { Head: ${stats.Heads} Tail: ${stats.Tails} } Ident: ${id}:${i}`]);
        }
        log.forEach(x => console.log(...x));
    };
    if (!isNaN(y)) for (let i = 0; i < y + Math.random(); ++i) it(i);
    else it(0);
}

// And you know what time it is...
// I'm gonna make a million x a million.
// - Mr. Coin Flipper (as Pharcyde)