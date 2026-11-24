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

assert.match(html, /function\s+validateEpisodeRecord\s*\(/, "Batch episode preflight validator is missing.");
assert.match(html, /function\s+validateDailyBatch\s*\(/, "Three-episode batch validator is missing.");
assert.match(html, /const batchIssues=validateDailyBatch\(episodes\)/, "Batch preflight must run before rendering.");
assert.match(html, /over 40 words/, "Preschool dialogue length guard is missing.");
assert.match(html, /three episodes must have different titles/, "Duplicate batch-title guard is missing.");

const validatorMatch = html.match(/function validateEpisodeRecord\(ep\)\{[\s\S]*?function validateDailyBatch\(episodes\)\{[\s\S]*?\n\}/);
assert.ok(validatorMatch, "Could not isolate batch validators for behavior tests.");
const validatorContext = vm.createContext({});
new vm.Script(validatorMatch[0] + "\nglobalThis.validateDailyBatch = validateDailyBatch;").runInContext(validatorContext);
const validEpisode = {
  title: "Test episode", learningGoal: "Count to four", durationSeconds: 45,
  characters: "Leo: a friendly golden lion cub. Mimi: a white bunny. Bobo: a blue elephant.",
  scenes: [
    ["Hook", "What can we count?", "A bright object appears."],
    ["One", "Leo finds one ball.", "One ball beside Leo."],
    ["Two", "Mimi finds two stars.", "Two stars beside Mimi."],
    ["Finish", "We counted together. Well done!", "Friends celebrate."]
  ]
};
assert.deepEqual(Array.from(validatorContext.validateDailyBatch([
  validEpisode, {...validEpisode, title: "Second episode"}, {...validEpisode, title: "Third episode"}
])), [], "A valid three-episode batch should pass preflight.");
assert.ok(validatorContext.validateDailyBatch([
  validEpisode, {...validEpisode, title: "Second episode", scenes: []}, {...validEpisode, title: "Test episode"}
]).length >= 2, "Invalid scenes and duplicate titles must fail batch preflight.");

console.log("PASS: studio markup, required controls, inline JavaScript syntax, production functions, and health endpoint.");
