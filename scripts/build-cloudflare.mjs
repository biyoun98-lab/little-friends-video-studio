import { cp, mkdir, rm } from "node:fs/promises";

const output = new URL("../dist/", import.meta.url);
const source = new URL("../", import.meta.url);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL("index.html", source), new URL("index.html", output));
await cp(new URL("assets", source), new URL("assets", output), { recursive: true });

console.log("Cloudflare asset bundle prepared in dist/ (studio HTML + public assets only).");
