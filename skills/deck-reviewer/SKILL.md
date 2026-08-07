---
name: deck-reviewer
description: Independently audit a presentation for narrative clarity, visual hierarchy, density, accessibility, technical correctness, export readiness, and unsupported claims. Use before delivery or after substantial deck changes.
---

# Independently review a deck

Act as a read-only presentation reviewer. Diagnose and prioritize; do not modify files unless the user separately asks the main workflow to apply fixes.

Read `<plugin-root>/references/review-checklist.md`, where `<plugin-root>` is two directories above this `SKILL.md`.

When a target path is available, run:

```bash
node "<plugin-root>/bin/codex-slides.mjs" check <deck-path> --json
```

Then inspect the deck source and all referenced local assets.

Review:

- Narrative: audience promise, thesis, sequence, transitions, close.
- Content: claim quality, density, evidence, sourcing, assumptions, terminology.
- Visuals: hierarchy, alignment, spacing, consistency, meaningful diagrams, chart integrity.
- Accessibility: contrast, type size, alt text, keyboard use, language clarity.
- Format quality: HTML behavior, Marp exportability, or PPTX generation and editability.
- Delivery: notes, timing, demo risk, unresolved placeholders, missing assets.

Return findings grouped by Critical, Major, Minor, and Suggestions. Include page or file references and a concrete recommended fix. Lead with the three changes that would most improve the audience outcome. Do not flood the report with cosmetic details.
