import { chromium } from "playwright";
import { strict as assert } from "node:assert";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });
try {
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20000);
  const browserErrors = [];
  page.on("pageerror", error => browserErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") browserErrors.push(message.text()); });
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
  await page.waitForFunction(() => document.querySelector("#renderStatus").textContent.includes("Video ready"), null, { timeout: 60000 }).catch(async error => { const status = await page.locator("#renderStatus").innerText(); const progress = await page.locator("#bar").evaluate(el => el.style.width); throw new Error(`Video export did not finish. Status: ${status}; progress: ${progress}; browser errors: ${browserErrors.join(" | ")}; ${error.message}`); });

  const renderDiagnostics = await page.evaluate(() => window.__renderDiagnostics || null);
  console.log("Render diagnostics:", JSON.stringify(renderDiagnostics));
  assert.ok(renderDiagnostics && renderDiagnostics.blobSize > 10000, "MediaRecorder must produce a non-empty video blob: " + JSON.stringify(renderDiagnostics));

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#videoDownload").click();
  const download = await downloadPromise;
  const output = resolve("artifacts", download.suggestedFilename());
  await download.saveAs(output);

  const probe = spawnSync("ffprobe", ["-v", "error", "-count_frames", "-show_entries", "format=duration,size:stream=codec_type,width,height,duration,nb_read_frames,r_frame_rate", "-of", "json", output], { encoding: "utf8" });
  assert.equal(probe.status, 0, "ffprobe must parse the exported video: " + probe.stderr);
  const media = JSON.parse(probe.stdout);
  const video = media.streams.find(stream => stream.codec_type === "video");
  const audio = media.streams.find(stream => stream.codec_type === "audio");
  assert.ok(video, "export must contain a video stream");
  assert.ok(audio, "export must contain the generated music audio stream");
  assert.equal(video.width, 1080, "portrait export width");
  assert.equal(video.height, 1920, "portrait export height");
  const frameRate = video.r_frame_rate ? video.r_frame_rate.split("/").map(Number) : [24, 1];
  const decodedDuration = Number(video.nb_read_frames) / (frameRate[1] ? frameRate[0] / frameRate[1] : 24);
  const measuredDuration = Number(media.format.duration || video.duration || decodedDuration);
  assert.ok(Number.isFinite(measuredDuration) && measuredDuration >= 2.5, "decoded video frames should cover at least 2.5 seconds; measured duration: " + measuredDuration + "; stream: " + JSON.stringify(video));
  assert.ok(renderDiagnostics.frameCount >= 60, "renderer should draw at least 60 frames for the 3-second test: " + JSON.stringify(renderDiagnostics));
  assert.ok(renderDiagnostics.elapsedSeconds >= 3.0, "renderer wall-clock duration should reach the requested 3 seconds: " + JSON.stringify(renderDiagnostics));
  assert.ok(Number(media.format.size) > 10000, "exported file should contain real media data");
  console.log(JSON.stringify({ result: "PASS", file: download.suggestedFilename(), durationSeconds: media.format.duration, bytes: media.format.size, video: { width: video.width, height: video.height }, audio: audio.codec_type }, null, 2));
} finally {
  await browser.close();
}
