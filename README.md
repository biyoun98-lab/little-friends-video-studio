# Little Friends Video Studio

A lightweight browser-based studio for planning and rendering short, child-friendly storyboard videos.

## Features
- Arabic, English, or bilingual episode planning
- Editable scene-by-scene storyboard and character continuity notes
- In-browser animated storyboard renderer using Canvas + MediaRecorder
- Vertical 9:16, landscape 16:9, and square 1:1 video layouts
- WebM video export (browser support required)
- SRT caption export and JSON publishing metadata for YouTube/TikTok
- Copy-ready production brief and local browser draft saving

## Run
Open `index.html` in a modern browser (Chrome recommended). No build step or API key is required. Keep the tab open while rendering. On mobile, use an up-to-date browser and allow downloads.

## Rendering scope
The built-in renderer creates a real animated video file from storyboard cards, text, gradients, and simple motion. It is not a generative-AI video engine and does not create realistic animated character footage or recorded narration. For that, add a secure server-side integration with a video-generation provider; never expose provider API keys in client-side HTML.

## Publishing scope
The studio exports a WebM video, SRT captions, and JSON metadata package. It does not upload or publish automatically. YouTube and TikTok publishing requires separate OAuth/account authorization and a server-side upload workflow. Review all child-directed content before publication.

## Child-safety defaults
For ages 2–6: gentle themes, simple language, no frightening imagery, dangerous imitation, personal-data requests, or external links in child-facing content. Use original visuals and properly licensed audio.
