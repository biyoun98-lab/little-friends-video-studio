import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server.address().port;
}

async function freePort() {
  const server = net.createServer();
  const port = await listen(server);
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Studio server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(baseUrl + "/api/health");
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Studio server did not become ready.");
}

test("LongCat adapter submits a job and retrieves its completed video", async t => {
  let submittedPayload;
  let receivedAuthorization;
  const worker = http.createServer(async (req, res) => {
    receivedAuthorization = req.headers.authorization;
    if (req.method === "POST" && req.url === "/generate") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      submittedPayload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ job_id: "mock-job-1" }));
      return;
    }
    if (req.method === "GET" && req.url === "/status/mock-job-1") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({
        status: "completed",
        video_url: `http://127.0.0.1:${worker.address().port}/video.mp4`
      }));
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  const workerPort = await listen(worker);
  const studioPort = await freePort();
  const baseUrl = `http://127.0.0.1:${studioPort}`;
  const token = "test-worker-token";
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(studioPort),
      FAL_KEY: "",
      LONGCAT_API_URL: `http://127.0.0.1:${workerPort}`,
      LONGCAT_API_TOKEN: token
    },
    stdio: "ignore"
  });

  t.after(async () => {
    if (child.exitCode === null) child.kill("SIGTERM");
    await new Promise(resolve => worker.close(resolve));
  });

  await waitForServer(baseUrl, child);

  const generateResponse = await fetch(baseUrl + "/api/longcat/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt: "Leo and Mimi share a blue ball",
      duration: 5,
      resolution: "480p",
      aspect_ratio: "9:16"
    })
  });

  assert.equal(generateResponse.status, 200);
  const generated = await generateResponse.json();
  assert.match(generated.request_id, /^longcat_/);
  assert.deepEqual(submittedPayload, {
    prompt: "Leo and Mimi share a blue ball",
    duration: 5,
    resolution: "480p",
    aspect_ratio: "9:16"
  });
  assert.equal(receivedAuthorization, `Bearer ${token}`);

  const statusResponse = await fetch(
    baseUrl + "/api/longcat/status?request_id=" + encodeURIComponent(generated.request_id)
  );
  assert.equal(statusResponse.status, 200);
  assert.deepEqual(await statusResponse.json(), {
    status: "COMPLETED",
    video_url: `http://127.0.0.1:${workerPort}/video.mp4`
  });
});
