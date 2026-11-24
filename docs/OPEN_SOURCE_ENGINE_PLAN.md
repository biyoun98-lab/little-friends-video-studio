# Open-source video engine integration plan

## Decision

Keep the browser renderer as the always-available free path. Treat open-source AI video generation as an optional external worker, not as a browser dependency and not as a paid API requirement.

## Candidate reviewed: WanGP

- Repository: https://github.com/deepbeepmeep/WanGP
- The project describes support for several open video models, image generation, audio, 3D, a browser UI, a queue, and an API/MCP interface.
- The project states that local use is free, but local generation still requires suitable compute. Its README describes selected low-VRAM modes, including some workflows starting around 4 GB VRAM; actual model, resolution, duration, speed, and memory needs vary.
- This repository's current app is a static/browser-first studio plus a small Node server. It does not contain the GPU runtime required to execute WanGP.
- The WanGP license file and a stable, versioned HTTP API contract have not yet been verified in this integration pass. Therefore no WanGP source code has been copied and no direct API calls have been added.

## Integration boundary

When a compatible worker is available, connect it only from the Node server:

1. The browser sends a scene prompt and approved output settings to the existing server.
2. The server validates duration, aspect ratio, resolution, and prompt size.
3. The server submits a job to a configured worker URL using a server-side secret if the worker requires one.
4. The browser polls the studio server for job status; it never receives worker credentials.
5. The completed clip is reviewed and then assembled with narration, captions, and music.
6. Publishing remains a separate manual approval step unless a supported publishing connection is explicitly configured.

Do not hard-code undocumented WanGP endpoints. First verify the selected WanGP release's API docs and license, then implement a small adapter and tests against that exact contract.

## Hardware and zero-cost reality

- WanGP is free software to run locally according to its project README; this does not mean GPU compute or hosting is free.
- The current user workflow is Android-first. A phone browser cannot realistically host the full WanGP model runtime. A separate compatible computer or GPU host is required for AI generation.
- If no GPU host is available, keep using the existing in-browser 2D renderer. It can export an animatic/storyboard video without paid credits, but it is not equivalent to full AI character animation.
- Never silently fall back from AI video to storyboard cards while describing the result as AI animation.

## Next engineering gates

- [ ] Verify the upstream license and exact API contract for a pinned WanGP release.
- [ ] Decide where the worker will run and verify GPU memory for the chosen model.
- [ ] Add a server-side worker adapter with strict URL allow-listing and timeouts.
- [ ] Add mocked tests for submit, queued, completed, failed, timeout, and malformed responses.
- [ ] Add a clip assembly stage and preserve character references across shots.
- [ ] Keep publishing manual until upload credentials and platform permissions are explicitly configured.

## Character consistency

The studio's canonical character designs are stored in `assets/character-bible.json`. Scene prompts should include the same character bible for every shot. A text prompt can encourage consistency but cannot guarantee identical characters across separate generated clips; reference images and a compatible image-conditioned workflow are needed for stronger identity preservation.
