# Little Friends Video Studio — Free Edition

A free browser-based production studio for original preschool cartoon videos (ages 2–6).

## Free features
- Episode details, learning objectives, character descriptions and editable storyboard.
- Automatic local draft saving while editing, including storyboard changes; drafts are restored when the studio is reopened on the same device and browser.
- One-click generator for original, child-safe preschool story templates featuring Leo, Mimi and Bobo.
- Daily batch builder that creates three distinct episode drafts and downloads a structured JSON production batch. Mixed-topic mode includes one education episode, one good-habits/tips episode, and a rotating third theme from colors, original songs, feelings, discovery or simple problem-solving.
- One-click sequential rendering of the saved three-episode batch, with each video downloaded separately and progress reporting.
- Full-batch preflight validation before the first render: checks all three episode records, four-scene structure, required story/visual fields, character continuity, dialogue length, child-safety wording, duration bounds and duplicate titles. A failed preflight stops the batch before any video is rendered.
- Built-in device speech preview for the episode narration (voice availability depends on the browser/device).
- Original animated 2D cartoon characters matching the channel designs: Leo (golden lion cub with red vest), Mimi (white bunny with pink dress and bow), and Bobo (small blue elephant).
- Moving scenery, animated ball, scene titles and story dialogue.
- Scene-aware foreground illustrations: plant growth, watering, toothbrushing, geometric shapes, rainbows, color activities, rain, counting and emotion cues are animated to match the storyboard.
- Browser-based video rendering in vertical 9:16, landscape 16:9 or square; exports MP4 when supported by the browser, with WebM fallback.
- Original gentle synthesized instrumental soundtrack mixed into every rendered video locally (Web Audio + MediaRecorder; no music API or paid credits required).
- Short original musical cues are triggered at scene changes and adapt to story themes such as counting, friendship, feelings, rain and nature.
- Optional local narration audio upload mixed with the original soundtrack in the exported video.
- Separate Leo, Mimi and Bobo voice selectors for browser narration previews; type dialogue as `Leo: ...`, `Mimi: ...` or `Bobo: ...` to assign character lines. Available voices depend on the device.
- Scene-aware visual direction: background palettes respond to story themes, the speaking/focused character moves to center stage, supporting friends scale down, and gentle camera zoom adds visual rhythm.
- Readable on-screen captions, episode/scene identity, progress bar and a consistent channel endline.
- Stronger creative scoring checks opening hooks, short preschool dialogue, questions, visual variety, story resolution and character continuity.
- Animated scene details include drifting clouds, swaying flowers, gentle character arm gestures and Bobo's moving trunk.
- Stronger pre-render quality checks for story structure, scene directions, consistent characters, repetitive dialogue and child-safety wording.
- SRT captions, production brief, saved drafts and YouTube/TikTok metadata package.
- Competitor research library: 19 relevant YouTube channels, 10 recent high-performing Instagram/TikTok short-form examples, and a live free RSS reader for the latest public YouTube uploads (up to 15 recent videos per channel). Search, filter, add personal reference links and export the saved library as JSON.
- Five new original story templates inspired by broad competitor mechanisms (alphabet-animal learning, action songs, animal rhyme parade, color-painting activity and morning routine) without copying source scripts, characters, music or footage.
- Three-episode publishing pack with YouTube Made for Kids metadata, TikTok captions and per-episode filenames; publishing hub links to Metricool, YouTube Studio and TikTok Studio. Automatic publishing still requires video files hosted at a public media URL and a supported publishing connection; the studio does not claim uploads have happened.
- Free public YouTube competitor feed: a GitHub Actions job refreshes recent public uploads from 27 researched competitor channels (all tracked by fixed public channel IDs) through YouTube RSS every six hours, without an API key. RSS exposes a limited recent feed (up to 15 items per channel), not the complete historical archive. The studio reads the generated JSON feed, so the feature can work on static hosting as well as the optional Node server.
- No paid AI generation service, API key or credit is required for the free browser renderer.
