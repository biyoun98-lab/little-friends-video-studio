# Little Friends Video Studio

A production workspace for original preschool videos (ages 2–6).

## Current capabilities
- Episode metadata, learning objective, character bible, mood and storyboard editor.\n- Competitor pattern notebook for user-selected public video examples; notes are saved in the browser and summarized without scraping or copying source videos.\n- Three-episode daily batch planner with distinct preschool learning stories, per-episode loading, and a JSON script export.
- Per-scene prompt builder that repeats the character bible and age-appropriate visual constraints.
- Optional Wan 3.0 Prime text-to-video generation through a private Node server and fal.ai queue.
- Vertical, landscape and square output; configurable 480p/720p/1080p; generated audio disabled.
- In-browser animated storyboard-card renderer (WebM). This is a fallback/animatic, not AI character animation.
- SRT captions, production brief, draft saving and YouTube/TikTok metadata package.
- A server health endpoint for deployment checks.

## Automated checks

GitHub Actions runs backend and browser-script syntax checks plus Node smoke tests. The smoke tests start the real Express server on an ephemeral local port and verify the health endpoint, safe AI-disabled responses when `FAL_KEY` is absent, and delivery of the studio homepage with its core production controls.

Run the checks locally with `npm install` followed by `npm test`.

## Run locally
1. Use Node.js 20+.
2. Copy `.env.example` to `.env`, then set `FAL_KEY` in the server environment.
3. Optional: set `FAL_VIDEO_MODEL` to a compatible Wan 3.0 Prime endpoint; default is `alibaba/wan-3.0-prime/text-to-video`.
4. Run `npm install` and `npm start`; open `http://localhost:3000`.

Never put the fal API key in browser code or commit a real key to GitHub. The app asks for confirmation before each paid generation. The connected fal account's current rate was reported as $0.05 per second for the selected model; a 5-second request is approximately $0.25 before configuration differences. Rates and final billing may change; check the provider before use. No video is generated automatically.

## Production workflow
1. Set episode details and keep the character descriptions exact.
2. Edit the storyboard, choose one scene, and use **Build scene prompt**.
3. Review the prompt and select the clip duration/resolution/aspect ratio.
4. Confirm the estimated paid generation to submit one scene. Repeat only for scenes you want to generate.
5. Review each clip for character consistency, child safety, visual artifacts and audio/text. The model call disables generated audio; add reviewed narration/music in an editor with properly licensed assets.
6. Export captions and publishing metadata. Download and manually upload the approved video to YouTube/TikTok.

## Important limitations\n- Competitor analysis currently works from public example URLs and pattern notes entered by the user; it does not automatically crawl TikTok/YouTube or retrieve competitor analytics.\n- The daily batch planner generates three original storyboards and a JSON export; it batch-renders three storyboard-card videos in sequence, but does not yet produce full character animation, voiceover, or automatically publish.
- Character consistency is encouraged by repeating the character bible, but text-to-video alone cannot guarantee identical characters across separate clips. A reference-image workflow is a future enhancement.
- The current AI path generates one scene clip per confirmed request; it does not automatically stitch clips, generate voiceover, create thumbnails, or publish to social accounts.
- The in-browser WebM renderer makes storyboard cards, not full AI animation. The three-episode batch planner creates three editable storyboards and can sequentially render and download three WebM storyboard-card videos in a supported browser. It still does not create full AI character animation.
- Queue job tracking is in server memory; keep a single server instance during generation. For multi-instance production, use a persistent job store.

## Optional LongCat-Video engine

The studio now exposes a secure adapter for a separately hosted LongCat-Video GPU worker. This is intentionally separate from the Node/Render web service: the official LongCat model is a 13.6B-parameter PyTorch/CUDA model, and its official setup requires a CUDA-capable GPU, model weights, PyTorch and FlashAttention. The free Render web tier is not a suitable place to run inference.

Configure these private server environment variables:
- `LONGCAT_API_URL`: HTTPS base URL of your LongCat worker (for example, your private GPU service URL).
- `LONGCAT_API_TOKEN`: optional bearer token shared with that worker.

The worker must implement this small HTTP contract:
- `POST /generate` with JSON `{ "prompt": "...", "duration": 5, "resolution": "480p", "aspect_ratio": "9:16" }`; respond with `{ "job_id": "..." }`.
- `GET /status/{job_id}`; respond with `{ "status": "queued|running|completed|failed" }`. When completed, include `"video_url": "https://..." `; when failed, optionally include `"error": "..." `.
- If a token is configured, accept it as `Authorization: Bearer <token>`.

Studio endpoints:
- `GET /api/longcat/health` reports whether a worker URL is configured.
- `POST /api/longcat/generate` starts a worker job and returns a studio request ID.
- `GET /api/longcat/status?request_id=...` polls the job.

The adapter validates input, keeps the worker token server-side, requires HTTPS for remote worker URLs, and does not expose the token to the browser. Job tracking is in memory and is lost when the Node server restarts. This adapter is a connection layer, not a bundled GPU worker: actual video generation remains unavailable until a compatible worker is deployed and configured. The existing Wan/fal.ai route remains unchanged.

The official LongCat demo scripts are research/demo entry points; review the upstream code and adapt the inference pipeline to accept user prompts before deploying a worker. Do not assume the upstream demo CLI is a ready-made production HTTP API.

## Deployment

A Render Blueprint is included in `render.yaml` and defaults to the free web-service tier. In Render, create a new Blueprint Instance from this repository, then add your fal API key as the private `FAL_KEY` environment variable. Do not commit the key. Free hosting may sleep when idle and is not a production uptime guarantee. The server keeps active queue job handles in memory, so keep the same instance alive until a clip finishes.

You can also deploy the included `Dockerfile` to a Node/Docker host and set the same environment variables there. Static GitHub Pages hosting cannot run the private generation API.

## Child-safety
Keep language simple and gentle. Avoid frightening imagery, dangerous imitation, bullying, personal-data requests and manipulative calls to action. A human must review every generated clip before publishing.
