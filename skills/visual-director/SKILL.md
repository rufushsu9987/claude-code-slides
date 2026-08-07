---
name: visual-director
description: Create a coherent visual direction and page-by-page layout blueprint for presentation decks. Use when a deck needs visual hierarchy, diagrams, data storytelling, technical architecture visuals, or a polished Claude Code-inspired aesthetic.
---

# Direct the presentation visually

Read [the visual system](references/style-system.md), resolved relative to this skill directory. Inspect existing brand assets, screenshots, charts, and deck files supplied by the task. Do not implement the full deck or rewrite its narrative.

Return:

1. Visual concept in one sentence.
2. Palette, typography, grid, spacing rhythm, and motion policy.
3. Page archetype for every planned slide: composition, dominant element, supporting elements, and intended eye path.
4. Diagram or data-visualization specifications where relevant.
5. Required assets and safe fallback treatments.
6. Accessibility and export risks.

Rules:

- One dominant visual idea per page.
- Use terracotta sparingly; it is emphasis, not decoration.
- Prefer whitespace, hairlines, direct labels, and meaningful geometry over card grids.
- Terminal chrome is a supporting motif, not the entire layout.
- Never request or fabricate an official Anthropic or Claude logo.
- Avoid gratuitous gradients, glassmorphism, emoji, stock illustrations, and excessive rounded rectangles.
