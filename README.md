# Little Friends Video Studio

A lightweight production studio for original, child-friendly videos for ages 2–6.

## Features
- Arabic, English, or bilingual episode briefs
- Editable scene-by-scene storyboard and child-safety checklist
- In-browser animated storyboard renderer (WebM; not AI character animation)
- Optional real AI text-to-video generation through a secure fal.ai queue backend
- Vertical 9:16, landscape 16:9, and square formats
- Captions (.srt), production brief (.txt), and publishing metadata (.json) for YouTube and TikTok
- Local browser draft saving

## Run locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `FAL_KEY` and `FAL_VIDEO_MODEL` using your fal.ai account credentials and a text-to-video model endpoint that accepts `prompt`, `duration`, and `aspect_ratio`.
3. Run `npm install`, then `npm start`.
4. Open `http://localhost:3000`.

Keep the API key only in the server environment. Never put it in frontend code or commit it to GitHub. The AI endpoint/model may have usage charges; check the provider's pricing and account balance before generating. The model input/output schema can vary, so use a compatible text-to-video endpoint.

## Publishing workflow
Render or generate a video, review it, then download the video and the publishing package. The package includes title, description, hashtags, captions, audience, format, and scene metadata. Upload manually through YouTube Studio or TikTok. This repository does not sign in to social accounts or publish automatically.

## Child-safety defaults
For ages 2–6: gentle themes, simple language, no frightening imagery, dangerous imitation, personal-data requests, or external links in child-facing content. Review every generated video before publishing.

## Deployment
Deploy the Node app to a host that supports persistent environment variables and outbound HTTPS requests. Configure `FAL_KEY` and `FAL_VIDEO_MODEL` in the host's secret/environment settings. Static hosting alone (such as GitHub Pages) cannot run the private generation backend.
