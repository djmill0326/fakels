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
async function explore(path, prefix="", depth=-1) {
    if (exclude.some(p => path.startsWith(p))) return;
    if (depth > -1) discovered.push("\t".repeat(depth) + path);
    try {
        prefix = join(prefix, path);
        const dirs = await opendir(prefix);
        for await (const dir of dirs) {
            if (!dir.isDirectory) continue;
            await explore(dir.name, prefix, depth + 1);
        }
    } catch {}
}
await explore(root);
writeFile(outfile || "directories.txt", discovered.join("\n"));
