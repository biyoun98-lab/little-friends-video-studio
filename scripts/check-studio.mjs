import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

const requiredIds = [
  "preview", "render", "renderBatch", "dailyBatch", "qualityStatus",
  "videoDownload", "narrationAudio", "scenes", "renderStatus"
];
for (const id of requiredIds) {
  assert.match(html, new RegExp('id="' + id + '"'), `Missing required studio element: ${id}`);
}

const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1].trim())
  .filter(Boolean);
assert.ok(inlineScripts.length > 0, "No inline application script was found.");
for (const [index, source] of inlineScripts.entries()) {
  assert.doesNotThrow(() => new vm.Script(source), `Inline script ${index + 1} has a syntax error.`);
}

assert.match(html, /function\s+saveDraft\s*\(/, "Automatic local draft saving is missing.");
assert.match(html, /addEventListener\("pagehide"/, "Draft persistence on page exit is missing.");
for (const name of ["generateDailyBatch", "renderAllBatch", "renderVideo", "runQualityCheck", "preferredMimeType", "videoExtension"]) {
  assert.match(html, new RegExp("function\\s+" + name + "\\s*\\("), `Missing production function: ${name}`);
}
assert.match(server, /\/api\/health/, "Health endpoint is missing.");
assert.match(server, /express\.static/, "Static studio hosting is missing.");

console.log("PASS: studio markup, required controls, inline JavaScript syntax, production functions, and health endpoint.");
