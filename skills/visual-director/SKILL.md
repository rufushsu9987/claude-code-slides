---
name: visual-director
description: Create a coherent visual direction and page-by-page layout blueprint for presentation decks. Use when a deck needs visual hierarchy, layout diversity, diagrams, data storytelling, technical architecture visuals, or a polished Claude Code-inspired aesthetic.
---

# Direct the presentation visually

Read [the visual system](references/style-system.md) and [the layout system](references/layout-system.md), resolved relative to this skill directory. Inspect existing brand assets, screenshots, charts, and deck files supplied by the task. Do not implement the full deck or rewrite its narrative.

Return:

1. Visual concept in one sentence.
2. Palette, typography, grid, spacing rhythm, and motion policy.
3. Page archetype for every planned slide: communication role, selected archetype, composition, dominant element, supporting elements, and intended eye path.
4. A layout-diversity audit: unique archetype count, consecutive repeats, visual-family rhythm, card-page share, and planned rhythm changes.
5. Diagram or data-visualization specifications where relevant.
6. Required assets and safe fallback treatments.
7. Accessibility and export risks.

Rules:

- One dominant visual idea per page.
- Choose layouts because they match the semantic job of the page, not to create random variety.
- In a 10-slide deck, target at least eight distinct archetypes when the content supports them.
- Never repeat the exact archetype consecutively.
- Keep card-grid and node-card pages below roughly 20% of the deck.
- Introduce a visible rhythm change every three to four slides.
- Use terracotta sparingly; it is emphasis, not decoration.
- Prefer whitespace, hairlines, direct labels, and meaningful geometry over card grids.
- Terminal chrome is a supporting motif, not the entire layout.
- Never request or fabricate an official Anthropic or Claude logo.
- Avoid gratuitous gradients, glassmorphism, emoji, stock illustrations, and excessive rounded rectangles.
