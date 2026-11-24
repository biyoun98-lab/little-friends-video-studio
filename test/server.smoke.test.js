import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

test("studio server smoke test: page, health, and safe AI-disabled responses", async (t) => {
  const port = 31000 + Math.floor(Math.random() * 20000);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), FAL_KEY: "" },
    stdio: "ignore"
  });
  t.after(() => child.kill("SIGTERM"));

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null) throw new Error("Studio server exited before becoming ready.");
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.equal(ready, true, "server should start and answer health checks");

  const health = await (await fetch(`${base}/api/health`)).json();
  assert.equal(health.ok, true);
  assert.equal(health.aiConfigured, false);

  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Little Friends Video Studio/);

  const generate = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: "A friendly animated blue ball", duration: 5 })
  });
  assert.equal(generate.status, 503, "AI generation must stay disabled without a server key");

  const status = await fetch(`${base}/api/status?request_id=not-a-real-job`);
  assert.equal(status.status, 503);
});
