---
name: repo-intake
description: Use when a repository, URL, or local project must be researched before creating grounded presentation, video, or social content.
version: 1.0.0
author: Rufus Hsu
license: MIT
metadata:
  hermes:
    tags: [repository, research, grounding, project-intake]
    related_skills: [create-deck, promo-video]
---

# Repository intake

The bundled `lib/promo.mjs` is copied beside `scripts/` so this Skill can run independently of the source repository.

Scan a local repository without executing its application code. Extract only evidence that can support a public project description.

## Workflow

1. Run the bundled scanner:

```bash
node scripts/project-intake.mjs <repository-path> --out <promo-dir> --source-url <public-url> --json
```

2. Read `project-facts.json` and `story-brief.md`.
3. Treat `identity`, `formats`, `commands`, and `evidence` as verified only when a source file is listed.
4. Treat every warning as a review item. Do not turn an inferred capability into a public claim.
5. Use the generated brief as input to the presentation workflow.

## Security

- The scanner redacts secret-like assignments and never writes raw credentials.
- Do not read `.env`, keychain contents, private keys, tokens, or binary media for intake.
- Do not run install, build, or application commands as part of intake.

## Completion criteria

- `project-facts.json` exists and parses.
- `story-brief.md` exists.
- Every public fact has a source or is explicitly marked for review.
- The report contains no secret values.
