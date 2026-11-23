# Little Friends Video Studio — Free Edition

A free browser-based production studio for original preschool cartoon videos (ages 2–6).

## Free features
- Episode details, learning objectives, character descriptions and editable storyboard.
- One-click generator for original, child-safe preschool story templates featuring Leo, Mimi and Bobo.
- Daily batch builder that creates three distinct episode drafts and downloads a structured JSON production batch. The mixed-topic mode guarantees coverage of education, good habits/tips, colors, and original learning songs.
- One-click sequential rendering of the saved three-episode batch, with each video downloaded separately and progress reporting.
- Built-in device speech preview for the episode narration (voice availability depends on the browser/device).
- Original animated 2D cartoon characters matching the channel designs: Leo (golden lion cub with red vest), Mimi (white bunny with pink dress and bow), and Bobo (small blue elephant).
- Moving scenery, animated ball, scene titles and story dialogue.
- Browser-based video rendering in vertical 9:16, landscape 16:9 or square; exports MP4 when supported by the browser, with WebM fallback.
- Optional local narration audio upload and mixing into the exported video (Web Audio + MediaRecorder; browser support required).
- Separate Leo, Mimi and Bobo voice selectors for browser narration previews; type dialogue as `Leo: ...`, `Mimi: ...` or `Bobo: ...` to assign character lines. Available voices depend on the device.
- Animated scene details include drifting clouds, swaying flowers, gentle character arm gestures and Bobo's moving trunk.
- Stronger pre-render quality checks for story structure, scene directions, consistent characters, repetitive dialogue and child-safety wording.
- SRT captions, production brief, saved drafts and YouTube/TikTok metadata package.
- No paid AI service, API key, subscription or generation credits required.

## Run locally
1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000` in Chrome.

You can also open `index.html` directly in a modern browser; rendering and downloads run locally in the browser. Keep the tab open while rendering. WebM recording support depends on the browser.

## Production workflow
1. Edit the episode title, learning goal and character descriptions.
2. Edit or add storyboard scenes.
3. Choose the vertical format for TikTok/YouTube Shorts or landscape for standard YouTube.
4. Press **Render video** and wait for the render to finish. The studio selects MP4 if the browser supports it; otherwise it exports WebM.
5. Choose a daily category (or All topics), then use **Build 3-episode daily batch** to create three distinct drafts. All topics mode creates three varied episodes per batch: education, good habits, and either colors or an original learning song.
6. Press **Render all 3 videos** to render each saved episode sequentially and download three separate MP4 files when the browser supports MP4, otherwise WebM files. Keep the browser tab open; stop the batch if you need to interrupt it.
7. Download the SRT captions and publishing metadata.
8. Review each final file, then upload manually to YouTube and TikTok.

## Limitations
- This is original 2D canvas animation featuring Leo, Mimi and Bobo, not photorealistic AI-generated 3D video. MP4 availability depends on browser MediaRecorder support; WebM is the fallback.
- Device speech preview is for listening only. To include narration in the exported WebM, record or prepare an audio file on your phone, load it in the optional narration field, preview it, and render. Audio mixing is performed locally in the browser.
- Learning songs use original written lyrics and browser speech preview; the studio does not generate a full musical backing track. Add properly licensed music in a free editor if desired.
- The studio does not upload or publish automatically. Social account connection and publication are not enabled.
- The render runs on the device; long videos may take time and require the browser tab to remain open.

## Child safety
Use gentle language and age-appropriate themes. Avoid frightening imagery, dangerous imitation, bullying, personal-data requests and manipulative calls to action. Review every video before publishing.
