# Promo Pipeline Agents Implementation Plan

> **For Hermes:** Use the repository's existing Agent Plugins, Codex, and Claude Code adapter conventions while implementing this plan.

**Goal:** Add a reusable, verifiable project-promotion pipeline that turns a repository into grounded promo facts, narration/TTS assets, HTML-first video assets, media QA evidence, release artifacts, and a Threads draft without publishing externally.

**Architecture:** Keep reasoning in portable Skills and Claude Code subagents. Keep deterministic work in zero-dependency Node scripts under `scripts/`, copied into skill-local `scripts/` by the existing synchronizer. The existing `create-deck`, `speaker-notes`, `deck-architect`, `visual-director`, and `deck-reviewer` capabilities remain the presentation core; the new pipeline owns the downstream media and release stages.

**Tech Stack:** Node.js 18+, Node standard library, optional `ffprobe`/`ffmpeg`, optional Playwright/Puppeteer/Chrome capture, existing Agent Plugins 1.0 manifests, Node test runner.

---

### Task 1: Add test fixtures and core pipeline contracts

**Objective:** Define stable JSON contracts and pure helpers before adding runtime scripts.

**Files:**
- Create: `test/promo-pipeline.test.mjs`
- Create: `test/fixtures/promo-source/README.md`
- Create: `test/fixtures/promo-source/package.json`
- Create: `test/fixtures/promo-source/plugin.json`

**Steps:**
1. Add tests for source file selection, safe text extraction, slug generation, scene timing validation, SRT formatting, and release artifact classification.
2. Run `node --test test/promo-pipeline.test.mjs`; verify the new imports/functions fail because the implementation does not exist.
3. Add the smallest pure helper module in `lib/promo.mjs`.
4. Re-run the targeted test and verify it passes.
5. Run the existing test suite to verify no baseline regression.

**Completion criteria:** Pure helpers have tests for normal, missing-file, malformed-input, and boundary cases; no test depends on network credentials or media binaries.

### Task 2: Implement repository intake

**Objective:** Scan a local repository or checked-out source and produce grounded project facts and a reusable story brief input.

**Files:**
- Create: `scripts/project-intake.mjs`
- Modify: `lib/promo.mjs`
- Test: `test/promo-pipeline.test.mjs`

**Steps:**
1. Add a failing test for `project-intake` output fields: source path, repository URL, license, package/plugin identity, supported formats, documented commands, selected source files, and warnings.
2. Run the targeted test and verify failure.
3. Implement local-path intake using only Node filesystem APIs; include README variants, manifests, package metadata, and relevant documentation without reading secrets or binary media.
4. Add optional `--source-url` metadata and a `--json` output mode; do not clone or execute arbitrary repository code inside the scanner.
5. Generate `project-facts.json` and `story-brief.md` with explicit `verified` versus `needs-review` fields.
6. Re-run targeted tests and a fixture dry run.

**Completion criteria:** Running `node scripts/project-intake.mjs <repo> --out <dir>` creates verifiable JSON/Markdown artifacts and never includes secret-like key values.

### Task 3: Implement narration and TTS preparation

**Objective:** Split approved narration into scenes, generate timing metadata, and provide a safe provider command boundary.

**Files:**
- Create: `scripts/narration-pipeline.mjs`
- Modify: `lib/promo.mjs`
- Test: `test/promo-pipeline.test.mjs`

**Steps:**
1. Add failing tests for Markdown scene parsing, segment filenames, estimated timings, SRT boundaries, and command-template validation.
2. Run the targeted test and verify failure.
3. Implement scene parsing from `## Scene N` headings or blank-line paragraphs.
4. Implement `--prepare` to write scene text, `timings.json`, and `narration.srt` using estimated durations when no audio exists.
5. Implement optional `--tts-command` with `{input}` and `{output}` placeholders; execute only after explicit command input and never print environment variables or command secrets.
6. If `ffprobe` is available, probe generated audio and replace estimated durations; otherwise mark timing confidence as `estimated`.
7. Re-run tests and a fixture dry run.

**Completion criteria:** The script can prepare a complete narration package without credentials, and a provider adapter can be plugged in without embedding a provider key in the repository.

### Task 4: Implement HTML video rendering helpers

**Objective:** Turn captured HTML slide frames plus timings into deterministic FFmpeg segments and a muxed video, with optional browser capture.

**Files:**
- Create: `scripts/html-video-renderer.mjs`
- Modify: `lib/promo.mjs`
- Test: `test/promo-pipeline.test.mjs`

**Steps:**
1. Add failing tests for frame ordering, concat manifest escaping, duration validation, and render-plan JSON output.
2. Run the targeted test and verify failure.
3. Implement `--plan` to read an HTML deck directory and `timings.json`, validate `slide-N.png` frames, and write a render plan.
4. Implement optional browser capture through a detected Playwright/Puppeteer adapter; fail with an actionable message when no adapter is installed instead of silently using another source.
5. Implement FFmpeg segment generation and optional audio/subtitle muxing when the binaries are available.
6. Keep `render=video` URL guidance and subtitle-safe requirements in the generated plan.
7. Re-run tests and a no-binary plan fixture.

**Completion criteria:** A captured-frame fixture produces a deterministic render plan and concat manifest; missing browser/FFmpeg dependencies result in clear nonzero failures.

### Task 5: Implement media QA

**Objective:** Produce evidence-based media validation for decks, audio, subtitles, and MP4 files.

**Files:**
- Create: `scripts/media-qa.mjs`
- Modify: `lib/promo.mjs`
- Test: `test/promo-pipeline.test.mjs`

**Steps:**
1. Add failing tests for media contract validation, SRT first/last cue checks, zero-byte detection, and pass/fail report generation.
2. Run the targeted test and verify failure.
3. Implement static checks that work without media binaries: required paths, nonzero sizes, scene/timing counts, SRT syntax, and secret-pattern scanning.
4. Implement optional `ffprobe`, full FFmpeg decode, and `volumedetect` checks with structured command output.
5. Emit `VIDEO_QA.md` and `video-qa.json` with PASS/FAIL status and exact evidence; never report visual inspection as completed unless a contact sheet or frame path is present.
6. Re-run tests and a fixture QA run.

**Completion criteria:** QA returns exit code 0 only when all available required checks pass, clearly distinguishes skipped optional checks, and never fabricates media results.

### Task 6: Implement release packaging and Threads draft generation

**Objective:** Assemble verified artifacts and generate a human-reviewable release bundle without external publishing.

**Files:**
- Create: `scripts/release-packager.mjs`
- Modify: `lib/promo.mjs`
- Test: `test/promo-pipeline.test.mjs`

**Steps:**
1. Add failing tests for artifact classification, path normalization, public-secret scanning, and Threads post splitting.
2. Run the targeted test and verify failure.
3. Implement package discovery for HTML/PPTX/MP4/MP3/SRT/QA files.
4. Require a passing QA manifest before marking a media artifact `verified`.
5. Generate `release-manifest.json`, `RELEASE_README.md`, and `threads-draft.md` from verified facts only.
6. Add explicit `external_publish_required: true` metadata and no publishing API calls.
7. Re-run tests and a fixture package run.

**Completion criteria:** Packaging is repeatable, public-safe, and produces a Threads-ready draft while preserving a human approval gate.

### Task 7: Add portable Skills and Codex forwarders

**Objective:** Expose the six new workflows to Codex and other Skills-capable clients.

**Files:**
- Create: `skills/repo-intake/SKILL.md`
- Create: `skills/narration-producer/SKILL.md`
- Create: `skills/html-video-renderer/SKILL.md`
- Create: `skills/media-qa/SKILL.md`
- Create: `skills/release-packager/SKILL.md`
- Create: `skills/promo-video/SKILL.md`
- Create: matching `.agents/skills/*/SKILL.md` forwarders
- Modify: `scripts/sync-skill-resources.mjs`
- Modify: `scripts/validate-plugin.mjs`
- Modify: `test/skills.test.mjs`

**Steps:**
1. Add failing manifest/skill tests for the six names, resources, forwarders, and portable-host restrictions.
2. Run `npm test -- --test-name-pattern='shared skills'`; verify failure.
3. Add concise Skills with triggers, exact script recipes, completion criteria, safety boundaries, and references to skill-local scripts.
4. Add canonical script mappings and run `npm run sync:skills`.
5. Update validator expected lists and resource mappings.
6. Re-run skill and manifest tests.

**Completion criteria:** Codex can invoke `$repo-intake`, `$narration-producer`, `$html-video-renderer`, `$media-qa`, `$release-packager`, and `$promo-video`; all forwarders point to authoritative Skills.

### Task 8: Add one unified promo-video entry point

**Objective:** Expose one top-level Claude Code entry point that orchestrates the six internal workflow scripts; do not create six separate top-level agents.

**Files:**
- Create: `agents/promo-video.md`
- Modify: `scripts/validate-plugin.mjs`
- Modify: `test/manifests.test.mjs`

**Steps:**
1. Add a failing test for the single `promo-video` native agent metadata and `${CLAUDE_PLUGIN_ROOT}` path.
2. Run the targeted test and verify failure.
3. Add a read-first, Bash-script-driven orchestrator that calls the existing deck skills plus intake, narration, renderer, QA, and release scripts.
4. Require media QA before packaging and human approval before publishing.
5. Re-run manifest tests and `claude plugin validate .` when available.

**Completion criteria:** Claude Code exposes one new `promo-video` orchestrator agent (four total including the existing three presentation agents), while Memory Hub owns the single persistent `Promo Pipeline Agent`.

### Task 9: Add CLI and documentation entry points

**Objective:** Make the pipeline discoverable and runnable from the existing CLIs and README files.

**Files:**
- Modify: `lib/cli.mjs`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `README.zh-TW.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `test/cli.test.mjs`

**Steps:**
1. Add failing CLI tests for `promo help`, `promo intake`, `promo qa`, and `promo package` delegation.
2. Run targeted CLI tests and verify failure.
3. Add a small `promo` command surface that delegates deterministic stages to the scripts and reports output paths/status.
4. Document Codex `$promo-video`, Claude Code `@promo-video`, the six focused skills/agents, HTML-first video rules, and the no-auto-publish boundary.
5. Re-run tests and inspect help output.

**Completion criteria:** A new user can discover and run the deterministic stages from CLI help and both README languages.

### Task 10: Full verification and integration review

**Objective:** Verify the implementation with real execution and prevent accidental changes to prior promo artifacts.

**Files:**
- Modify only files owned by Tasks 1–9 if fixes are required.

**Steps:**
1. Run targeted tests for the new pipeline.
2. Run `npm run sync:skills` and `npm run check`.
3. Run fixture intake, narration preparation, render planning, media QA, and release packaging end to end.
4. Run `git diff --check` on tracked implementation paths and inspect `git status --short`; leave pre-existing untracked `promo-deck/`, `promo-html/`, and prompt artifacts untouched.
5. Search implementation and generated release outputs for secret-like patterns and external publish calls.
6. Run a final integration review over manifests, scripts, skills, agents, docs, and tests.

**Completion criteria:** All automated checks pass; fixture pipeline produces real manifests/reports/drafts; missing optional binaries are reported honestly; no external publication occurs; pre-existing artifacts are not rewritten or deleted.
