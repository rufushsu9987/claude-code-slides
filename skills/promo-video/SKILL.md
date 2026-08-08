---
name: promo-video
description: Use when one project must become a complete grounded promotion package: repository facts, deck, narration/TTS, HTML-first video, media QA, release artifacts, and a Threads draft.
version: 1.0.0
author: Rufus Hsu
license: MIT
metadata:
  hermes:
    tags: [orchestration, promotion, video, repository, threads]
    related_skills: [create-deck, speaker-notes, repo-intake, narration-producer, html-video-renderer, media-qa, release-packager]
---

# Unified project promotion pipeline

This is the single top-level workflow. Internally it coordinates six deterministic stages; do not ask the user to manually hand work from one top-level Agent to another.

## Bundled scripts

- `scripts/project-intake.mjs`
- `scripts/narration-pipeline.mjs`
- `scripts/html-video-renderer.mjs`
- `scripts/media-qa.mjs`
- `scripts/release-packager.mjs`
- `scripts/promo-pipeline.mjs`
- `lib/promo.mjs` (shared runtime dependency for the bundled scripts)

## Pipeline

1. Run `repo-intake` and review `project-facts.json`.
2. Use the existing `create-deck`, `deck-architect`, and `visual-director` capabilities to create an HTML, Marp, or editable PPTX deck. For HTML-first video, the HTML deck and `NARRATION.md` are required inputs, and starter placeholder copy must be removed before validation.
3. Use `speaker-notes`, then run `narration-producer` for scene audio, timings, and subtitles.
4. Use `html-video-renderer` with HTML as the only visual source. Pass `--capture` only when Playwright or Puppeteer is installed; otherwise record `html_capture_runtime` as deferred/unverified and do not publish a video claimed to be HTML-derived.
5. Run `media-qa`; do not package or publish a failed or unverified media result.
6. Run `release-packager` to create a bundle and Threads draft.

For deterministic stages, the unified command is:

```bash
node scripts/promo-pipeline.mjs run <repository-path> \
  --out promo \
  --deck promo/deck/index.html \
  --html promo/deck/index.html \
  --speaker-notes NARRATION.md \
  --narration NARRATION.md \
  --tts-command 'provider-cli --input {input} --output {output}' \
  --source-url https://github.com/example/project \
  --frames video/html-frames \
  --capture \
  --visual-evidence video/qa-contact-sheet.png \
  --visual-inspected \
  --require-visual \
  --strict \
  --json
```

Use `--strict` when every stage must be present. A partial run must state exactly which stages were skipped and why.

## Rules

- Ground every public claim in repository evidence.
- Keep HTML as the visual source of truth when HTML video is requested.
- Never expose or persist API keys, Keychain values, tokens, or private paths in public artifacts.
- Run QA after every media or subtitle change.
- Produce a draft only; require explicit human approval before any external publication.

## Completion criteria

- `pipeline-status.json` records every stage as completed, skipped, or failed.
- A release bundle is created only after media QA passes, unless explicitly labeled unverified.
- The final response lists real artifact paths and verification evidence.
