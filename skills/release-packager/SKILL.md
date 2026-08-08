---
name: release-packager
description: Use after media QA to assemble verified project artifacts and generate a human-reviewable Threads draft without publishing externally.
version: 1.0.0
author: Rufus Hsu
license: MIT
metadata:
  hermes:
    tags: [release, packaging, threads, artifacts, publishing-safety]
    related_skills: [media-qa, promo-video]
---

# Release packaging

The bundled `lib/promo.mjs` is copied beside `scripts/` so this Skill can run independently of the source repository.

Collect approved artifacts, copy them into a release bundle, and generate public copy from verified facts only.

## Workflow

```bash
node scripts/release-packager.mjs <promo-dir> \
  --out release \
  --facts project-facts.json \
  --qa video/video-qa.json \
  --repo-url https://github.com/example/project \
  --json
```

Inspect:

- `release-manifest.json`
- `RELEASE_README.md`
- `threads-draft.md`
- `artifacts/`

A media bundle requires a passing QA manifest unless `--allow-unverified` is used for an explicitly labeled review bundle.

## Safety

- This workflow never calls Threads, GitHub, YouTube, email, or other publishing APIs.
- Keep `external_publish_required: true` in the manifest.
- Review URLs, claims, visibility, filenames, and secrets before publication.

## Completion criteria

- Every copied artifact has a kind and verification status.
- The Threads draft stays within the configured per-post limit.
- The release bundle contains no secret-like values.
- Publishing remains a separate, human-approved action.
