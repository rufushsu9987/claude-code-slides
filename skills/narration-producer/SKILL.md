---
name: narration-producer
description: Use when an approved deck or script needs scene narration, TTS segments, timings, and subtitles for a technical explainer video.
version: 1.0.0
author: Rufus Hsu
license: MIT
metadata:
  hermes:
    tags: [narration, tts, subtitles, timing, video]
    related_skills: [speaker-notes, promo-video]
---

# Narration and TTS preparation

The bundled `lib/promo.mjs` is copied beside `scripts/` so this Skill can run independently of the source repository.

Turn approved narration into scene files and a timing package. The deterministic script owns file naming, SRT formatting, and timing validation; the Agent owns editorial decisions.

## Workflow

1. Write or approve a source file with `## Scene N` headings, or separate paragraphs.
2. Prepare the package:

```bash
node scripts/narration-pipeline.mjs NARRATION.md --out video --json
```

3. Inspect `video/segments/`, `video/narration.mp3`, `video/timings.json`, and `video/narration.srt`.
4. If a provider adapter is explicitly configured, run it with placeholders:

```bash
node scripts/narration-pipeline.mjs NARRATION.md --out video \
  --tts-command 'provider-cli --input {input} --output {output}' --json
```

5. Re-probe generated audio when `ffprobe` is available; never treat estimated timing as measured timing.

## Security

- Provider commands must receive credentials through the provider's secure local mechanism.
- Never paste, print, or write an API key into a command, source file, log, or report.
- A failed or unmeasured provider run must remain visible in the output status.

## Completion criteria

- Scene text, timings, and SRT are all present.
- When TTS is enabled, a combined `video/narration.mp3` exists and can be probed.
- Timing confidence is `measured` only after audio durations were probed.
- The scene count and subtitle cue count agree.
