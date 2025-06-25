/* sseg (Simple Structured Entropy Generator) [v1-final] */

import { argv } from "process";
const arg3 = parseFloat(argv[4]);
const weight = .5 + (isNaN(arg3) ? 0 : arg3);
export const coin = Object.create(null);
Object.defineProperty(coin, "flip", { get() { return Math.random() < weight ? "Tails" : "Heads" } });
const stats = { Heads: 0, Tails: 0 };
const arg1 = parseFloat(argv[2]);
if (!isNaN(arg1)) {
    const arg2 = parseFloat(argv[3]);
    const [x, y] = isNaN(arg2) ? [arg1] : Math.random() < .5 ? [arg1, arg2] : [arg2, arg1];
    const it = (id) => {
        const log = [];
        for (let i = 0; i < Math.round(x + Math.random()); ++i) {
            const result = coin.flip;
            ++stats[result];
            const str = i.toString();
            log.push(["0".repeat(6 - str.length) + str, result, Math.random().toFixed(3), "[random float]", "\n", `stats { Head: ${stats.Heads} Tail: ${stats.Tails} } Ident: ${id}:${i}`]);
        }
        log.forEach(x => console.log(...x));
    };
    if (!isNaN(y)) for (let i = 0; i < Math.round(y + Math.random()); ++i) it(i);
    else it(0);
}

// And you know what time it is...
// I'm gonna make a million x a million.
// - Sir Pharcyde