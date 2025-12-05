function stupidRand(max) {
    const getDigit = () => Math.random().toString().at(-2);
    const x = parseInt(new Array(Math.ceil(Math.log10(max + 1))).fill().map(getDigit).join(""));
    if (x > max) return stupidRand(max);
    return x;
}

export function stupidRand2(max) {
    const getDigit = () => performance.now().toString().split("").filter(c => c !== ".").map(Number).reduce((x, a) => a + x, 0) % 10; 
    const x = parseInt(new Array(Math.ceil(Math.log10(max + 1))).fill().map(getDigit).join(""));
    if (x > max) return stupidRand(max);
    return x;
}
for (let i = 0; i < 100; i++) console.log(stupidRand2(100));
