---
name: deck-reviewer
description: Independently audit a presentation for narrative clarity, layout diversity, visual hierarchy, density, accessibility, technical correctness, export readiness, and unsupported claims. Use before delivery or after substantial deck changes.
---

# Independently review a deck

Act as a read-only presentation reviewer. Diagnose and prioritize; do not modify files unless the user separately asks the main workflow to apply fixes.

## Bundled resources

Resolve these paths relative to this skill directory:

- [Review checklist](references/review-checklist.md)
- [Brand-neutral visual quality](references/visual-quality.md)
- [Layout system](references/layout-system.md)
- [Python SVG authoring protocol](references/python-svg-authoring.md)
- [Python SVG plan template](references/python-svg-plan.md)
- `scripts/slides-cli.mjs` — portable wrapper for deterministic validation
- `scripts/generate-slide-art.py` — optional pattern library and fallback renderer
- `diagram-design` skill — when available, for auditing standalone diagrams and redraw assets

Keep the user's project or workspace as the shell working directory. Resolve each helper from the directory containing this `SKILL.md`, convert it to an absolute path, and do not `cd` into the installed skill directory. Replace `<absolute-skill-dir>` below with that real directory; never type the placeholder literally.

When a target path is available, run:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" check <deck-path> --json
```

Then inspect the deck source, `deck-plan.md`, rendered pages, notes, and referenced local assets.

## Review order

### 1. Plan fidelity

When `deck-plan.md` exists, treat it as the source of truth and compare:

- audience, desired outcome, thesis, and Direction Lock
- slide roles, claims, evidence status, and order
- information shape, visual form, layout archetype, geometry, density, and eye path
- section transitions and Narrative Review
- editing constraints and source assets

Flag silent changes to thesis, evidence, order, or page meaning. Fit, alignment, spacing, and equivalent implementation-medium changes are acceptable when semantic intent remains intact.

When a non-trivial deck has no plan, flag that as Major and reconstruct enough of the intended contract to audit the result.

### 2. Narrative

Review:

- audience promise, thesis, story spine, section sequence, transitions, and close
- whether each page has one unique informational job
- claim-style titles and defensible wording
- evidence proximity and source conflicts
- repeated points, unsupported conclusions, and solution-before-root-cause jumps
- whether visible takeaway callouts add a real implication instead of repeating the title

For same-section slide pairs, name the exact gap and the least disruptive fix.

### 3. Semantic layout fit

For every page ask:

1. What is the information shape?
2. What visual form is implemented?
3. Does the selected layout archetype make the evidence-to-claim relationship clear?
4. Would a simpler medium communicate more honestly?

Flag:

- bullets turned into cards without semantic reason
- protocol interactions drawn as generic architecture
- causal chains misrepresented as timelines
- handoffs with no owners or triggers
- boundaries with no named crossing or enforcement
- loops with no feedback effect
- screenshots that do not state what they prove
- code used as decoration
- aligned records rebuilt from text boxes instead of a native table

### 4. Layout sequence and visual quality

Review page roles, archetype fit, unique count, consecutive repeats, visual-family rhythm, card share, split-page share, same-geometry runs, and rhythm changes.

For decks of 10 or more slides:

- flag fewer than eight distinct archetypes as Major unless repeated matched structures are justified
- flag exact consecutive archetype repeats
- flag card-grid or node-card pages above roughly 20%
- flag generic split-screen pages above roughly 35%
- flag more than two consecutive pages with the same underlying geometry
- flag more than four pages without a visible rhythm change

Also review hierarchy, alignment, spacing, typography, chart integrity, editability, source fidelity, and thumbnail readability.

### 5. Cover

Flag a cover as Major when its right half is occupied by an unsourced generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagram that does not prove the title.

Prefer whitespace or one sourced artifact, compact proof rail, operational signal, or direct system cue. Review two-second comprehension, thumbnail readability, title dominance, and whether the right-side module remains secondary.

Flag proof rails that mix unrelated signals without explicit roles, sources, relationships, and disclosure dates. For a mechanism-led opening, require a next page explanatory handoff when the causal model cannot be understood from the cover alone.

### 6. Visual assets and custom SVG

Review agreement between custom `.visual.md`, `.py`, and `.svg` files, plus use of the `diagram-design` type grammar and self-check where applicable.

Treat a custom SVG with no plan, a stale plan, fabricated labels, non-reproducible output, or geometry that merely fills space as Major. Built-in kinds are not required; judge whether the chosen medium and custom composition fit the source material.

Check source of truth, semantic model, accessible metadata, deterministic regeneration, stable `viewBox`, labels, units, dates, boundaries, and editable outside content.

### 7. Accessibility and format quality

Review:

- contrast, type size, alt text, keyboard use, language clarity, and color-independent meaning
- HTML navigation, hash state, scaling, printing, notes, asset paths, and layout markers
- Marp classes, overflow, theme loading, assets, and exportability
- PPTX generation, 16:9 layout, editable text/shapes/charts, native tables, layout and geometry sequences, notes, text bounds, and font portability
- delivery timing, demo fallbacks, unresolved placeholders, and missing assets

## Output

Return findings grouped by Critical, Major, Minor, and Suggestions. Include page or file references and a concrete recommended fix.

Lead with the three changes that most improve the audience outcome. Do not flood the report with cosmetic details or repeat deterministic warnings without interpretation.
