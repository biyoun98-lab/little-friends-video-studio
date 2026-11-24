import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../cloudflare/worker.js";

test("Cloudflare Worker serves static assets through the asset binding", async () => {
  let received;
  const response = await worker.fetch(
    new Request("https://studio.example/"),
    { ASSETS: { fetch: async request => {
      received = request.url;
      return new Response("studio page", { status: 200 });
    } } }
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "studio page");
  assert.equal(received, "https://studio.example/");
});

test("Cloudflare Worker proxies API requests to the configured HTTPS backend", async () => {
  const originalFetch = globalThis.fetch;
  let upstream;
  globalThis.fetch = async request => {
    upstream = request;
    return Response.json({ ok: true }, { status: 200 });
  };

  try {
    const response = await worker.fetch(
      new Request("https://studio.example/api/health?check=1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ping: true })
      }),
      {
        BACKEND_ORIGIN: "https://studio-api.example",
        ASSETS: { fetch: async () => new Response("unexpected asset", { status: 500 }) }
      }
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(upstream.url, "https://studio-api.example/api/health?check=1");
    assert.equal(upstream.method, "POST");
    assert.equal(upstream.headers.get("x-forwarded-host"), "studio.example");
    assert.deepEqual(await upstream.json(), { ping: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Cloudflare Worker fails closed when the API backend is not configured", async () => {
  const response = await worker.fetch(
    new Request("https://studio.example/api/health"),
    { ASSETS: { fetch: async () => new Response("unexpected asset", { status: 500 }) } }
  );

  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not connected/);
});

test("Cloudflare Worker rejects non-HTTPS remote backend origins", async () => {
  const response = await worker.fetch(
    new Request("https://studio.example/api/health"),
    {
      BACKEND_ORIGIN: "http://studio-api.example",
      ASSETS: { fetch: async () => new Response("unexpected asset", { status: 500 }) }
    }
  );

  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /misconfigured/);
});
