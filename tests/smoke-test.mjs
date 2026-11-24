import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(s => s.trim());
assert.ok(scripts.length, "index.html must contain an inline application script");
for (const [i, source] of scripts.entries()) {
  new vm.Script(source, { filename: "index.inline-" + (i + 1) + ".js" });
}
for (const id of ["dailyBatch", "renderBatch", "qualityCheck", "render", "srt", "package"]) {
  assert.ok(html.includes('id="' + id + '"') || html.includes("id='" + id + "'"), "Missing UI control: " + id);
}
for (const feature of ["function generateDailyBatch", "async function renderAllBatch", "function runQualityCheck", "function drawStoryVisual", "function captions", "Creative score:", "scene-aware", "LEARN • PLAY • GROW"]) {
  assert.ok(html.includes(feature), "Missing production feature: " + feature);
}
assert.match(html, /dailyTarget:3/, "Daily batch target should remain three episodes");
assert.match(html, /createMediaStreamDestination/, "Audio should be mixed into the rendered video stream");
assert.match(html, /video\/mp4/, "MP4 output should be preferred when supported");
assert.match(html, /video\/webm/, "WebM fallback should remain available");

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, "HTML element IDs must be unique");
console.log("Studio smoke tests passed: " + scripts.length + " inline script(s) parsed, " + ids.length + " unique IDs, and core production features found.");
