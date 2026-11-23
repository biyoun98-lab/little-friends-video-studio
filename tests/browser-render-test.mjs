import { chromium } from "playwright";
import { strict as assert } from "node:assert";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(15000);
  await page.goto("file://" + resolve("index.html"));
  await page.locator("#qualityCheck").click();
  const quality = await page.locator("#qualityStatus").innerText();
  assert.match(quality, /Production checklist passed/, "sample episode should pass the production checklist");

  await page.locator("#duration").evaluate(el => {
    const option = document.createElement("option");
    option.value = "3";
    option.textContent = "3 seconds (automated test)";
    el.append(option);
    el.value = "3";
  });
  await page.locator("#fps").selectOption("24");
  await page.locator("#ratio").selectOption("portrait");
  await page.locator("#render").click();
  await page.waitForFunction(() => document.querySelector("#renderStatus").textContent.includes("Video ready"), null, { timeout: 30000 });

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#videoDownload").click();
  const download = await downloadPromise;
  const output = resolve("artifacts", download.suggestedFilename());
  await download.saveAs(output);

  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_type,width,height", "-of", "json", output], { encoding: "utf8" });
  assert.equal(probe.status, 0, "ffprobe must parse the exported video: " + probe.stderr);
  const media = JSON.parse(probe.stdout);
  const video = media.streams.find(stream => stream.codec_type === "video");
  const audio = media.streams.find(stream => stream.codec_type === "audio");
  assert.ok(video, "export must contain a video stream");
  assert.ok(audio, "export must contain the generated music audio stream");
  assert.equal(video.width, 1080, "portrait export width");
  assert.equal(video.height, 1920, "portrait export height");
  assert.ok(Number(media.format.duration) >= 2.5, "exported clip should be close to the requested 3 seconds");
  assert.ok(Number(media.format.size) > 10000, "exported file should contain real media data");
  console.log(JSON.stringify({ result: "PASS", file: download.suggestedFilename(), durationSeconds: media.format.duration, bytes: media.format.size, video: { width: video.width, height: video.height }, audio: audio.codec_type }, null, 2));
} finally {
  await browser.close();
}
