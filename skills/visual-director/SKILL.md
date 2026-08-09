---
name: visual-director
description: Create a coherent visual direction and page-by-page layout blueprint for presentation decks. Use when a deck needs visual hierarchy, layout diversity, diagrams, data storytelling, technical architecture visuals, or a polished Claude Code-inspired aesthetic.
---

# Direct the presentation visually

Read [the visual system](references/style-system.md), [the layout system](references/layout-system.md), and [the Python SVG authoring protocol](references/python-svg-authoring.md), resolved relative to this skill directory. Inspect existing brand assets, screenshots, charts, and deck files supplied by the task. Do not implement the full deck or rewrite its narrative.

Return:

1. Visual concept in one sentence.
2. Palette, typography, grid, spacing rhythm, and motion policy.
3. Page archetype for every planned slide: communication role, selected archetype, composition, dominant element, supporting elements, and intended eye path.
4. For each cover or section opener, a `coverRight` decision: `none`, `artifact-right`, `proof-rail`, `signal-stack`, or `direct-system-cue`, with the source and why it earns its place.
5. For each proposed custom Python SVG, a `pythonSvgPlan`: plan path, script path, output path, communication job, source of truth, semantic model, geometry, eye path, editable outside content, and validation requirements.
6. A layout-diversity audit: unique archetype count, consecutive repeats, visual-family rhythm, card-page share, and planned rhythm changes.
7. Diagram or data-visualization specifications where relevant.
8. Required assets and safe fallback treatments.
9. Accessibility and export risks.

Rules:

- One dominant visual idea per page.
- Choose layouts because they match the semantic job of the page, not to create random variety.
- In a 10-slide deck, target at least eight distinct archetypes when the content supports them.
- Never repeat the exact archetype consecutively.
- Keep card-grid and node-card pages below roughly 20% of the deck.
- Introduce a visible rhythm change every three to four slides.
- Use terracotta sparingly; it is emphasis, not decoration.
- Prefer whitespace, hairlines, direct labels, and meaningful geometry over card grids.
- On covers, default to a title-led composition and whitespace. The right half is optional.
- Use a cover's right half only for one sourced artifact, compact proof rail, operational signal, or direct system cue that is understandable within two seconds.
- Never invent generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagrams as cover filler. If no meaningful module exists, leave the space empty.
- Keep any cover-side module secondary to the title and no wider than roughly one-third of the canvas.
- Treat a proof rail as evidence, not as the full explanation. Give each signal a role and state how the signals relate.
- When the opening thesis is causal or cyclical, move the mechanism to the next page rather than overloading the cover.
- Plan custom Python SVGs from the semantic model, not from a fixed drawing kind. Write `<visual>.visual.md` before implementation and treat built-in kinds as reference patterns or fallbacks only.
- Specify why Python SVG is better than a screenshot, verified chart, native editable shapes, or whitespace for that page.
- Terminal chrome is a supporting motif, not the entire layout.
- Never request or fabricate an official Anthropic or Claude logo.
- Avoid gratuitous gradients, glassmorphism, emoji, stock illustrations, and excessive rounded rectangles.
