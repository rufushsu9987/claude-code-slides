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
- [Python SVG authoring protocol](references/python-svg-authoring.md)
- `scripts/slides-cli.mjs` — portable wrapper for deterministic validation

Keep the user's project or workspace as the shell working directory. Resolve the script from the skill directory; do not `cd` into the installed skill before running it.

When a target path is available, run:

```bash
node scripts/slides-cli.mjs check <deck-path> --json
```

Then inspect the deck source and all referenced local assets.

Review:

- Narrative: audience promise, thesis, sequence, transitions, close.
- Cover: title and promise dominance, right-side information value, source quality, two-second comprehension, thumbnail readability, and whether whitespace would be stronger.
- Content: claim quality, density, evidence, sourcing, assumptions, terminology.
- Layout sequence: page roles, archetype fit, unique count, consecutive repeats, visual-family rhythm, card share, and rhythm changes.
- Visuals: hierarchy, alignment, spacing, consistency, meaningful diagrams, chart integrity, and agreement between custom `.visual.md`, `.py`, and `.svg` files.
- Accessibility: contrast, type size, alt text, keyboard use, language clarity.
- Format quality: HTML behavior and layout markers, Marp classes and exportability, or PPTX generation, layout sequence, and editability.
- Delivery: notes, timing, demo risk, unresolved placeholders, missing assets.

For decks of 10 or more slides, flag fewer than eight distinct archetypes as a Major finding unless the content clearly requires a repeated matched structure. Flag exact consecutive repeats, card-grid or node-card pages above roughly 20%, or more than four slides without a visible rhythm change.

Flag a cover as Major when its right half is occupied by an unsourced generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagram that does not directly prove the title. Recommend whitespace or one sourced artifact, compact proof rail, operational signal, or direct system cue instead. Also flag proof rails that mix unrelated signals without roles, relationship, and visible disclosure dates. For mechanism-led openings, require a dedicated explanatory handoff page when the causal model cannot be understood from the cover alone. Treat a custom SVG with no plan, stale plan, fabricated labels, non-reproducible output, or geometry that merely fills space as a Major finding. Built-in kinds are not required; judge whether the chosen medium and custom composition fit the source material.

Return findings grouped by Critical, Major, Minor, and Suggestions. Include page or file references and a concrete recommended fix. Lead with the three changes that would most improve the audience outcome. Do not flood the report with cosmetic details.
