# Free-tier deployment: Cloudflare edge + existing Node API

This is an optional hosting layer for the mobile-first studio. It does not replace the existing Express server or create a GPU video-generation service.

## Architecture

- Cloudflare Workers Static Assets serves the studio page and the public character-bible JSON.
- A small Cloudflare Worker forwards only `/api/*` requests to the existing Node/Express server.
- The Node server remains the private API origin and continues to hold `FAL_KEY`, LongCat credentials, and in-memory generation job state.
- The browser uses same-origin `/api/*` paths, so it does not need cross-origin API credentials.

The static build copies only `index.html` and `assets/` into `dist/`. It deliberately does not upload the repository, tests, server code, or environment files as public assets.

## Free-plan fit and limitations

Cloudflare's published free limits currently include up to 100,000 Workers requests per day and a 10 ms CPU-time limit per request. Static assets are served separately by Cloudflare's asset system. These limits are suitable for a lightweight studio interface and API proxy, not for running video models.

The existing Render Node service remains responsible for API calls and job polling. Its free service may sleep while idle. The Worker proxy cannot keep that origin awake or guarantee uninterrupted video jobs.

Actual AI video generation is still a separate provider operation:
- Wan through fal.ai is a paid generation path and requires a private `FAL_KEY`.
- LongCat requires a separately deployed CUDA/GPU worker and its own model weights.
- Cloudflare Workers do not run these video-generation models.

Cloudflare free limits and provider plans can change. Review current official limits before enabling production traffic.

## One-time setup

1. Keep the existing Render Node service deployed from this repository. Copy its HTTPS service origin, for example `https://your-service.onrender.com` (do not include a path).
2. In Cloudflare, create an API token with the Workers Scripts edit permission for the intended account. Find the account ID in the Cloudflare dashboard.
3. In the GitHub repository, open **Settings → Secrets and variables → Actions** and add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Deploy the Worker once from the GitHub repository: **Actions → Deploy Cloudflare edge studio → Run workflow**.
5. In the Cloudflare Worker settings, add the encrypted secret `BACKEND_ORIGIN` with the Render HTTPS origin from step 1. Alternatively, use Wrangler locally:
   `npx wrangler secret put BACKEND_ORIGIN`
   Then enter the Render origin when prompted.
6. Open the deployed `workers.dev` URL. Confirm the homepage loads and `/api/health` reports the existing server's health.

If `BACKEND_ORIGIN` is absent, the static studio page can still load, but API requests intentionally return HTTP 503. Do not treat that as a successful full deployment.

## Updating

The deployment workflow is manual by design. Run it after reviewing a change. The normal GitHub Actions test workflow remains responsible for checking the Node server and the Worker proxy.

## Security notes

- Never put `FAL_KEY`, `LONGCAT_API_TOKEN`, or `BACKEND_ORIGIN` in browser code or commit them to Git.
- The Worker accepts a fixed backend origin from its server-side environment; it does not accept a destination URL from the browser.
- Remote backend origins must use HTTPS and cannot include credentials, paths, query strings, or fragments.
- Only the static build output is published as public assets.
