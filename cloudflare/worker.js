function getBackendOrigin(value) {
  if (!value) return null;
  const url = new URL(value);
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) {
    throw new Error("BACKEND_ORIGIN must use HTTPS (HTTP is allowed only for localhost).");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("BACKEND_ORIGIN must be an origin only, without credentials, path, query, or fragment.");
  }
  return url.origin;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      let origin;
      try {
        origin = getBackendOrigin(env.BACKEND_ORIGIN);
      } catch {
        return Response.json({ error: "The studio API origin is misconfigured." }, { status: 500 });
      }

      if (!origin) {
        return Response.json(
          { error: "The studio API is not connected yet. Configure BACKEND_ORIGIN for this Worker." },
          { status: 503 }
        );
      }

      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.set("x-forwarded-host", url.host);
      headers.set("x-forwarded-proto", url.protocol.slice(0, -1));

      const upstreamUrl = new URL(url.pathname + url.search, origin);
      const hasBody = !["GET", "HEAD"].includes(request.method);
      const upstreamRequest = new Request(upstreamUrl, {
        method: request.method,
        headers,
        body: hasBody ? await request.arrayBuffer() : undefined,
        redirect: "manual"
      });

      return fetch(upstreamRequest);
    }

    return env.ASSETS.fetch(request);
  }
};
