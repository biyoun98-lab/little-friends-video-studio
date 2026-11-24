import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";

async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = address.port;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 10000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(baseUrl + "/api/health");
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Server did not become ready: " + (lastError?.message || "timeout"));
}

test("server smoke tests", async t => {
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), FAL_KEY: "", LONGCAT_API_URL: "", LONGCAT_API_TOKEN: "" },
    stdio: "ignore"
  });

  t.after(() => {
    if (child.exitCode === null) child.kill("SIGTERM");
  });

  await waitForServer(baseUrl, child);

  await t.test("health endpoint reports AI as unconfigured without exposing secrets", async () => {
    const response = await fetch(baseUrl + "/api/health");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.aiConfigured, false);
    assert.equal(body.longcatConfigured, false);
    assert.equal(typeof body.model, "string");
    assert.equal("key" in body, false);
  });

  await t.test("LongCat health endpoint reports an unconfigured GPU worker", async () => {
    const response = await fetch(baseUrl + "/api/longcat/health");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.configured, false);
    assert.equal(body.engine, "LongCat-Video");
  });

  await t.test("LongCat generation is safely disabled without a GPU worker URL", async () => {
    const response = await fetch(baseUrl + "/api/longcat/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "Leo and Mimi play together", duration: 5 })
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /LONGCAT_API_URL/);
  });

  await t.test("AI generation is safely disabled when no server key is configured", async () => {
    const response = await fetch(baseUrl + "/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "A friendly preschool animation", duration: 5 })
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /FAL_KEY/);
  });

  await t.test("status endpoint is safely disabled when no server key is configured", async () => {
    const response = await fetch(baseUrl + "/api/status?request_id=test");
    assert.equal(response.status, 503);
  });

  await t.test("homepage serves the studio and its core production tools", async () => {
    const response = await fetch(baseUrl + "/");
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Little Friends Video Studio/);
    assert.match(html, /LongCat-Video/);
    assert.match(html, /Create 3 episodes/);
    assert.match(html, /Render all 3 episodes/);
    assert.match(html, /Publishing package/);
  });
});
