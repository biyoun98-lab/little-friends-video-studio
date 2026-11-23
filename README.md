# Little Friends Video Studio

A production workspace for original preschool videos (ages 2–6).

## Current capabilities
- Episode metadata, learning objective, character bible, mood and storyboard editor.
- Per-scene prompt builder that repeats the character bible and age-appropriate visual constraints.
- Optional Wan 3.0 Prime text-to-video generation through a private Node server and fal.ai queue.
- Vertical, landscape and square output; configurable 480p/720p/1080p; generated audio disabled.
- In-browser animated storyboard-card renderer (WebM). This is a fallback/animatic, not AI character animation.
- SRT captions, production brief, draft saving and YouTube/TikTok metadata package.
- A server health endpoint for deployment checks.

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

## Important limitations
- Character consistency is encouraged by repeating the character bible, but text-to-video alone cannot guarantee identical characters across separate clips. A reference-image workflow is a future enhancement.
- The current AI path generates one scene clip per confirmed request; it does not automatically stitch clips, generate voiceover, create thumbnails, or publish to social accounts.
- The in-browser WebM renderer makes storyboard cards, not full AI animation.
- Queue job tracking is in server memory; keep a single server instance during generation. For multi-instance production, use a persistent job store.

## Deployment\n\nA Render Blueprint is included in `render.yaml` and defaults to the free web-service tier. In Render, create a new Blueprint Instance from this repository, then add your fal API key as the private `FAL_KEY` environment variable. Do not commit the key. Free hosting may sleep when idle and is not a production uptime guarantee. The server keeps active queue job handles in memory, so keep the same instance alive until a clip finishes.\n\nYou can also deploy the included `Dockerfile` to a Node/Docker host and set the same environment variables there. Static GitHub Pages hosting cannot run the private generation API.\n\n## Child-safety
Keep language simple and gentle. Avoid frightening imagery, dangerous imitation, bullying, personal-data requests and manipulative calls to action. A human must review every generated clip before publishing.
