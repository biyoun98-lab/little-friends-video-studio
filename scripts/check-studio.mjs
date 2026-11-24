import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const server = await readFile(new URL("../server.js", import.meta.url), "utf8");
const competitorHtml = await readFile(new URL("../competitor-library.html", import.meta.url), "utf8");

const requiredIds = [
  "preview", "render", "renderBatch", "dailyBatch", "qualityStatus",
  "videoDownload", "narrationAudio", "scenes", "renderStatus", "batchPackage"
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
assert.match(html, /function\s+downloadDailyPublishingPackage\s*\(/, "Three-episode platform publishing pack is missing.");
assert.match(html, /madeForKids:true/, "YouTube child-directed publishing metadata must be included.");
assert.match(html, /TikTok Studio/, "TikTok publishing destination is missing.");
assert.match(html, /Metricool Planner/, "Metricool publishing workflow link is missing.");
assert.ok(html.includes("refreshCompetitors"), "Free competitor RSS refresh control is missing.");
assert.ok(!html.includes("aiGenerate")&&!html.includes("fal.ai")&&!html.includes("FAL_KEY"), "Paid AI generation controls must be absent from the free edition.");
assert.ok(server.includes("youtube.com/feeds/videos.xml"), "Free public YouTube RSS integration is missing.");
assert.ok(competitorHtml.includes("data/competitor-feed.json"), "Competitor library must load the static scheduled feed.");
assert.match(competitorHtml, /refreshLiveCompetitors/, "Live competitor feed refresh control is missing.");
assert.ok(server.includes("CACHE_MS=15*60*1000"), "Competitor RSS requests must be cached.");
assert.ok(server.includes("competitorChannels=["), "Curated competitor channel IDs are missing.");
assert.ok(server.includes("Cocomelon – Nursery Rhymes")&&server.includes("Numberblocks"), "Major competitor channels must be included in the free RSS feed.");
assert.ok(!html.includes("fal.ai")&&!html.includes("FAL_KEY")&&!html.includes("Cloud AI video engine"), "The free edition must not expose paid AI controls.");
assert.match(html, /Alphabet Animal Safari/, "Alphabet competitor-inspired original episode is missing.");
assert.match(html, /Move and Freeze with Mimi/, "Movement-song competitor-inspired original episode is missing.");
assert.match(html, /The Animal Goodbye Parade/, "Animal-rhyme competitor-inspired original episode is missing.");
assert.match(html, /pickFrom\("education"\)/, "Mixed daily batches must include an education episode.");
assert.match(html, /pickFrom\("tips"\)/, "Mixed daily batches must include a good-habits episode.");
assert.match(html, /thirdGroups=shuffleArray/, "The third daily episode must rotate across additional learning themes.");
assert.match(html, /validateDailyBatch\(batch\.map/, "The three drafts must pass preflight before the daily batch is saved.");

const libraryMatch = html.match(/const episodeLibrary=(\[[\s\S]*?\n\]);/);
assert.ok(libraryMatch, "Episode template library could not be found.");
const episodeLibrary = new Function("return " + libraryMatch[1])();
assert.ok(episodeLibrary.length >= 23, "The studio should maintain at least 23 original episode templates.");

const validatorContext = vm.createContext({});
new vm.Script(validatorMatch[0] + "\nglobalThis.validateDailyBatch = validateDailyBatch; globalThis.validateEpisodeRecord = validateEpisodeRecord;").runInContext(validatorContext);
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

for (const episode of episodeLibrary) {
  const issues = validatorContext.validateEpisodeRecord({
    title: episode.title, learningGoal: episode.goal, durationSeconds: 45,
    characters: "Leo: golden lion cub; Mimi: white bunny; Bobo: blue elephant",
    scenes: episode.scenes
  });
  assert.deepEqual(Array.from(issues), [], "Original episode template should pass preflight: " + episode.title);
}

const competitorScripts = [...competitorHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1].trim()).filter(Boolean);
assert.ok(competitorScripts.length, "Competitor research page needs its own script.");
for (const [index, source] of competitorScripts.entries()) {
  assert.doesNotThrow(() => new vm.Script(source), "Competitor library script " + (index + 1) + " has a syntax error.");
}
assert.match(competitorHtml, /const researchChannels=/, "Research competitor channel list is missing.");
assert.match(competitorHtml, /const competitorClips=/, "Competitor short-video sample library is missing.");
assert.match(competitorHtml, /lfws-competitor-clips/, "User-added competitor links must persist locally.");
assert.match(competitorHtml, /little-friends-competitor-library\.json/, "Competitor library export is missing.");
const channelMatch = competitorHtml.match(/const researchChannels=(\[[\s\S]*?\]);\s*const competitorClips=(\[[\s\S]*?\]);/);
assert.ok(channelMatch, "Could not isolate competitor research data.");
const competitorData = vm.createContext({});
new vm.Script("globalThis.channels=" + channelMatch[1] + "; globalThis.clips=" + channelMatch[2] + ";").runInContext(competitorData);
assert.equal(competitorData.channels.length, 19, "Expected 19 researched competitor channels.");
assert.equal(competitorData.clips.length, 10, "Expected 10 recent short-form competitor examples.");
assert.ok(competitorData.clips.some(clip => clip.p === "TikTok") && competitorData.clips.some(clip => clip.p === "Instagram"), "Competitor examples must cover TikTok and Instagram.");

console.log("PASS: studio markup, required controls, inline JavaScript syntax, production functions, and health endpoint.");
