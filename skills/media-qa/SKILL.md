---
name: media-qa
description: Use before delivering a deck video or release bundle to verify media metadata, decoding, audio levels, subtitles, timing, visual evidence, and public-safe text.
version: 1.0.0
author: Rufus Hsu
license: MIT
metadata:
  hermes:
    tags: [qa, media, ffprobe, subtitles, verification]
    related_skills: [review-deck, promo-video]
---

# Media QA

The bundled `lib/promo.mjs` is copied beside `scripts/` so this Skill can run independently of the source repository.

Run evidence-based checks and report what was actually tested. Do not infer a successful render from a file name or an earlier command.

## Workflow

```bash
node scripts/media-qa.mjs <promo-dir> \
  --video video/final.mp4 \
  --timings video/timings.json \
  --subtitles video/narration.srt \
  --visual-evidence video/qa-contact-sheet.png \
  --out video \
  --strict \
  --json
```

The script checks file size, timing continuity, SRT syntax/count, secret-like values, FFprobe shape/codecs, full FFmpeg decode, audio levels, and visual-evidence state.

Use `--visual-inspected` only after an Agent or human has actually inspected the referenced frame/contact sheet. Use `--require-visual` when visual inspection is part of the release gate.

## Completion criteria

- `video-qa.json` and `VIDEO_QA.md` exist.
- Every failed check is fixed or explicitly reported as a blocker.
- Optional tools are marked skipped, never silently reported as passed.
- External publishing has not been performed.
