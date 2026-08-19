---
name: visual-director
description: Create a coherent, brand-aware visual direction and page-by-page layout blueprint for presentation decks. Use when a deck needs visual hierarchy, layout diversity, diagrams, data storytelling, technical architecture visuals, accessibility planning, or a polished aesthetic.
---

# Direct the presentation visually

Read [brand-neutral visual quality](references/visual-quality.md), [the layout system](references/layout-system.md), and [the Python SVG authoring protocol](references/python-svg-authoring.md), resolved relative to this skill directory. Use the bundled [Python SVG plan template](references/python-svg-plan.md) and `scripts/generate-slide-art.py` only when the visual workflow needs them. Read [the Claude Code-inspired visual system](references/style-system.md) only when the selected template is `claude-editorial` / `terminal-editorial`, or the user explicitly requests Claude styling.

When available, use the `diagram-design` skill for standalone diagram types and Mermaid/draw.io redraws; its selected type reference and self-check govern that visual asset. Inspect existing brand assets, screenshots, charts, deck files, and `deck-plan.md`. Do not rewrite the deck's narrative or silently change claims.

Resolve bundled scripts to absolute paths from the directory containing this `SKILL.md`, and execute them while keeping the user's project as the shell working directory. Do not change into the installed skill directory.

## Workflow

1. Read the communication contract, Direction Lock, evidence ledger, section map, Narrative Review, and slide blueprints from `deck-plan.md`.
2. For each slide, identify the information shape before choosing a visual form or layout archetype.
3. Select the visual form that explains the evidence-to-claim relationship fastest.
4. Resolve the archetype, geometry, dominant element, density, and eye path.
5. Check the page against the previous two and next page for semantic fit and visual rhythm.
6. Update the layout fields in `deck-plan.md` when a workspace exists; otherwise return a complete layout blueprint to the orchestrator.
7. Audit the sequence at thumbnail scale before implementation.

## Return

1. A one-sentence visual concept.
2. Palette, typography, grid, spacing rhythm, and motion policy.
3. A page-by-page `layoutBlueprint` containing:
   - slide role and claim title
   - evidence status
   - information shape
   - selected visual form
   - layout archetype
   - geometry
   - dominant element
   - density
   - intended eye path
   - composition and supporting elements
   - source assets and editable outside content
   - transition handoff
4. For each cover or section opener, a `coverRight` decision: `none`, `artifact-right`, `proof-rail`, `signal-stack`, or `direct-system-cue`, with the source and why it earns its place.
5. For each proposed custom Python SVG, a `pythonSvgPlan`: plan path, script path, output path, communication job, source of truth, semantic model, geometry, eye path, editable outside content, and validation requirements.
6. A layout-diversity audit: unique archetype count, consecutive repeats, visual-family rhythm, card-page share, split-page share, same-geometry runs, and planned rhythm changes.
7. Diagram, native-table, chart, screenshot, code, or protocol-sequence specifications where relevant.
8. Required assets and safe fallback treatments.
9. Accessibility and export risks.

## Semantic layout rules

- One dominant visual idea per page.
- Choose layouts because they match the page's information shape and semantic job, not to create random variety.
- A protocol interaction uses actors, message order, and labeled request/response arrows; it is not a generic architecture diagram.
- A causal chain is not automatically a timeline.
- Column-aligned records are a native table, not a matrix made from text boxes.
- Screenshots state what they prove and use no more than four callouts.
- Architecture shows real services, stores, flows, ownership, and boundaries; never add components for visual complexity.
- Every arrow names data, identity, protocol, decision, or ownership.
- Cards are an implementation tool, never the default answer to a list.
- Every page has an internal audience takeaway, but a visible takeaway strip is default-off when the title and working area already carry the implication.

## Deck-level rhythm

For a deck of 10 or more slides:

- target at least eight distinct archetypes when the content supports them
- never repeat the exact archetype on consecutive slides
- do not let the same visual family dominate more than two of any three consecutive slides
- keep card-grid and node-card pages at or below roughly 20%
- keep generic split-screen pages at or below roughly 35%
- avoid more than two consecutive slides with the same underlying geometry
- introduce a visible rhythm change every three to four slides through scale, density, background, or dominant visual
- interleave claims with evidence, systems, sequences, risks, and decisions

Rhythm must remain causal. Do not place a layout merely because the deck has not used it yet.

## Cover rules

- Default to a title-led composition and whitespace; the right half is optional.
- Use the right half only for exactly one sourced artifact, compact proof rail, operational signal, or direct system cue that can be understood within two seconds.
- Keep any right-side module secondary to the title and normally no wider than one-third of the canvas.
- Never invent generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagrams as cover filler.
- If no meaningful module exists, leave the space empty.
- Give every proof-rail number a semantic role, source, date, and explicit relationship to the other signals.
- When the opening is causal or mechanism-led, keep the proof rail concise and use the next page for the mechanism. The handoff should move from evidence to causal model to implication instead of expanding the cover into a dashboard.

## Diagram and data rules

- Prefer a native chart for quantitative relationships and preserve definitions, axes, units, dates, sources, and decision implications.
- Use a native table for repeated records with aligned columns.
- Use protocol lifelines for ordered interactions across actors.
- Use lanes for ownership and handoff.
- Use boundaries for trust, tenancy, network, or control-plane crossings.
- Draw a loop only when feedback changes the next cycle.
- Use a screenshot for a real interface or artifact and a diagram for a conceptual model; do not redraw evidence into a cleaner but less truthful abstraction.
- When a standalone architecture, flowchart, sequence, state, ER, timeline, swimlane, quadrant, loop, chart, data-flow, or security visual is needed, prefer `diagram-design` or follow its type-specific grammar and self-check.

## Custom Python SVG

- Plan from the semantic model, not from a fixed drawing kind.
- Write `<visual>.visual.md` before `<visual>.py`, then generate `<visual>.svg`.
- Default to a deck-local generator for a source-specific mechanism, architecture, journey, boundary, or scene.
- State why Python SVG communicates better than a screenshot, verified chart, native editable shapes, or whitespace.
- Keep title, explanation, source note, footer, and speaker notes editable outside the SVG whenever possible.
- Treat built-in kinds as examples and fast fallbacks, not a closed catalog.
- Verify accessible metadata, deterministic regeneration, source fidelity, and readability at presentation and thumbnail scale.

## Brand and craft

- When using the Claude Code-inspired system, use terracotta sparingly; it is emphasis, not decoration.
- Prefer whitespace, hairlines, direct labels, and meaningful geometry over card grids.
- Terminal chrome is a supporting motif, not the entire layout.
- Never request or fabricate an official Anthropic or Claude logo.
- Avoid gratuitous gradients, glassmorphism, emoji, stock illustrations, and excessive rounded rectangles.
