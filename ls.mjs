import { opendir, writeFile } from "fs/promises";
import { join } from "path";
import process from "process";
const [_node, _script, root, outfile] = process.argv;
if (!root) {
    console.error("Error: A root folder is required as the first argument.");
    process.exit(1);
}
const exclude = [".git", "node_modules", /* ... */];
const discovered = [];
async function explore(path) {
    if (exclude.reduce((p, c) => p || path.startsWith(c), false)) return;
    discovered.push(path);
    try {
        const dirs = await opendir(path);
        for await (const dir of dirs) {
            if (!dir.isDirectory) continue;
            await explore(join(path, dir.name), discovered);
        }
    } catch {}
}
await explore(root);
writeFile(outfile || "directories.txt", discovered.join("\n"));