---
name: html-video-renderer
description: Use when an HTML deck must become a deterministic 1920x1080 video while preserving HTML as the single visual source of truth.
version: 1.0.0
author: Rufus Hsu
license: MIT
metadata:
  hermes:
    tags: [html, video, rendering, ffmpeg, browser]
    related_skills: [create-deck, promo-video]
---

# HTML-first video rendering

The bundled `lib/promo.mjs` is copied beside `scripts/` so this Skill can run independently of the source repository.

Render video from captured HTML frames, not from an unrelated PPTX or image deck. The workflow produces a plan even when optional browser or FFmpeg tools are unavailable.

## Workflow

1. Ensure the HTML deck supports a video mode that hides controls and reserves subtitle-safe space.
2. Capture frames with an installed Playwright or Puppeteer adapter:

```bash
node scripts/html-video-renderer.mjs \
  --html index.html \
  --capture \
  --timings video/timings.json \
  --frames video/html-frames \
  --out video \
  --json
```

3. Without browser capture, supply verified `slide-N.png` frames and create a render plan:

```bash
node scripts/html-video-renderer.mjs \
  --timings video/timings.json \
  --frames video/html-frames \
  --out video \
  --json
```

4. To encode, provide narration and subtitles. The script uses 1920x1080, 30 fps, H.264, and optional AAC audio.
5. Inspect the render plan before encoding; missing frames or non-contiguous timings are hard failures.

## Completion criteria

- Every timing scene has exactly one captured frame.
- `render-plan.json` and `html-video-concat.txt` exist.
- The final video is explicitly reported as not rendered when FFmpeg was not run.
- The MP4 is later checked by `media-qa`.
