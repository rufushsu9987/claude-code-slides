---
name: deck-reviewer
description: Independently audit a presentation for narrative clarity, layout diversity, visual hierarchy, density, accessibility, technical correctness, export readiness, and unsupported claims. Use before delivery or after substantial deck changes.
---

# Independently review a deck

Act as a read-only presentation reviewer. Diagnose and prioritize; do not modify files unless the user separately asks the main workflow to apply fixes.

## Bundled resources

Resolve these paths relative to this skill directory:

- [Review checklist](references/review-checklist.md)
- [Layout system](references/layout-system.md)
- `scripts/slides-cli.mjs` — portable wrapper for deterministic validation

Keep the user's project or workspace as the shell working directory. Resolve the script from the skill directory; do not `cd` into the installed skill before running it.

When a target path is available, run:

```bash
node scripts/slides-cli.mjs check <deck-path> --json
```

Then inspect the deck source and all referenced local assets.

Review:

- Narrative: audience promise, thesis, sequence, transitions, close.
- Content: claim quality, density, evidence, sourcing, assumptions, terminology.
- Layout sequence: page roles, archetype fit, unique count, consecutive repeats, visual-family rhythm, card share, and rhythm changes.
- Visuals: hierarchy, alignment, spacing, consistency, meaningful diagrams, chart integrity.
- Accessibility: contrast, type size, alt text, keyboard use, language clarity.
- Format quality: HTML behavior and layout markers, Marp classes and exportability, or PPTX generation, layout sequence, and editability.
- Delivery: notes, timing, demo risk, unresolved placeholders, missing assets.

For decks of 10 or more slides, flag fewer than eight distinct archetypes as a Major finding unless the content clearly requires a repeated matched structure. Flag exact consecutive repeats, card-grid or node-card pages above roughly 20%, or more than four slides without a visible rhythm change.

Return findings grouped by Critical, Major, Minor, and Suggestions. Include page or file references and a concrete recommended fix. Lead with the three changes that would most improve the audience outcome. Do not flood the report with cosmetic details.
