---
name: create-deck
description: Create a polished presentation deck from a topic, brief, document, URL, or repository. Use for slides, presentations, pitch decks, technical talks, architecture reviews, status reports, training decks, or source-to-slides conversion. Supports HTML, Marp, PPTX, named professional templates, content-aware layout archetypes, and existing slide frameworks.
---

# Create a presentation deck

Create the presentation requested in the current user message. Treat it as a deliverable: inspect the source material, create editable files, validate the result, and leave clear preview or export instructions.

## Bundled resources

Resolve these paths relative to this skill directory:

- [Storytelling system](references/storytelling.md)
- [Brand-neutral visual quality](references/visual-quality.md) — read for every deck
- [Claude Code-inspired visual system](references/style-system.md) — read only after selecting `claude-editorial` / `terminal-editorial`, or when the user explicitly requests Claude styling
- [Layout system](references/layout-system.md)
- [Python SVG authoring protocol](references/python-svg-authoring.md)
- [Python SVG plan template](references/python-svg-plan.md)
- [Output format guidance](references/output-formats.md)
- `scripts/slides-cli.mjs` — portable wrapper for the bundled deck CLI
- `scripts/generate-slide-art.py` — optional pattern library and fallback renderer
- `diagram-design` skill — when available, for editorial architecture, flowchart, sequence, data, and security diagrams plus Mermaid/draw.io redraws

Keep the user's project or workspace as the shell working directory. Resolve each helper from the directory containing this `SKILL.md`, convert it to an absolute path, and do not `cd` into the installed skill before running it. In commands below, replace `<absolute-skill-dir>` with that real absolute directory; never type the placeholder literally.

## 1. Choose the delivery format

Honor an explicit format. Otherwise infer it from the intended use:

- **HTML**: default for live talks, design fidelity, interaction, offline playback, browser sharing, or unspecified output.
- **Marp**: Markdown review, Git diffs, documentation-style decks, or fast PDF generation.
- **PPTX**: editable Microsoft PowerPoint, corporate handoff, or Office compatibility.
- **Existing framework**: preserve Slidev, Reveal.js, React, Marp, or a company template already used by the repository unless the user requests migration.

Do not ask the user to choose when the request already implies a sensible default. State the assumption briefly and proceed.

## 2. Choose a template

Honor an explicit template name. Otherwise select the closest match to the audience and communication goal. The default is `claude-editorial`; the legacy name `terminal-editorial` remains an alias.

List the installed presets when needed:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" templates
node "<absolute-skill-dir>/scripts/slides-cli.mjs" templates --format pptx --json
```

Recommended selection:

| Template | Best use |
| --- | --- |
| `claude-editorial` | Technical talks, architecture reviews, AI and developer tooling |
| `executive-brief` | Leadership updates, strategy proposals, quarterly reviews |
| `cloud-architecture` | Infrastructure, platform engineering, security boundaries |
| `data-story` | Analytics, research findings, metrics, evidence-led narratives |
| `product-launch` | Product demos, launches, roadmaps, feature narratives |
| `dark-terminal` | Live demos, code walkthroughs, engineering deep dives |
| `incident-review` | Postmortems, impact timelines, root cause, remediation |

A supplied brand system or existing company template always takes precedence over a bundled preset.

Apply the brand-neutral visual-quality reference to every selection. Load the Claude Code-inspired visual system only when the selected template is `claude-editorial` / `terminal-editorial`, or when the user explicitly requests that style.

## 3. Inspect the source material

- Read every local file, URL, document, image, or code path the request depends on.
- For repository-based technical decks, identify the actual architecture, dependencies, data flows, trust boundaries, deployment model, operations, costs, and risks.
- Preserve attribution for external facts, charts, screenshots, quotations, and benchmarks.
- Label uncertain claims as assumptions.
- Never copy confidential material into a deck unless the intended audience is authorized to receive it.

## 4. Lock the communication objective

Infer or establish:

- audience and current knowledge
- the decision, belief, or action the deck should create
- duration and page budget
- one-sentence audience promise
- central thesis
- strongest evidence and weakest assumption

Ask only for a missing constraint that materially changes the output. Otherwise make a reasonable assumption and continue.

## 5. Plan the story and layout sequence

For non-trivial decks, use the sibling `deck-architect` and `visual-director` skills when available. Otherwise perform those planning roles inline.

Synthesize one concise outline. Every page must have one job, one memorable takeaway, and one layout archetype selected from the bundled layout system. A useful narrative sequence is cover → context → tension → thesis → evidence → execution → risks → decision, but adapt it to the source.

For every `editorial-cover`, explicitly record `coverRight` as one of `none`, `artifact-right`, `proof-rail`, `signal-stack`, or `direct-system-cue`, plus the source or rationale. Choose `none` when no source-backed artifact, proof, or signal improves the opening.

When an opening asks how a mechanism works, separate proof from explanation: use the cover for sourced signals, then plan a dedicated explanatory page. When a content-specific SVG is the best medium, create a deck-local `<visual>.visual.md` plan before writing `<visual>.py`, then generate `<visual>.svg`. Built-in drawing kinds are examples and fallbacks, not a closed catalog; use one only when it already matches the communication job.

Before implementation, produce a layout sequence and check it against these rules:

- Use at least eight distinct archetypes in a deck of 10 or more slides when the content supports them.
- Never repeat the exact archetype on consecutive slides.
- Do not let the same visual family dominate more than two of any three consecutive slides.
- Keep card-grid and node-card pages at or below roughly 20% of the deck.
- Introduce a visible rhythm change every three to four slides through scale, density, background, or dominant visual.
- Interleave editorial claim pages with evidence, architecture, sequence, risk, and decision pages.

Use `node "<absolute-skill-dir>/scripts/slides-cli.mjs" layouts` to inspect the available archetypes.

## 6. Scaffold the output

Run the bundled helper from the user's workspace:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" init "Deck title" --format html --template claude-editorial
node "<absolute-skill-dir>/scripts/slides-cli.mjs" init "Deck title" --format marp --template data-story
node "<absolute-skill-dir>/scripts/slides-cli.mjs" init "Deck title" --format pptx --template executive-brief
```

The default destination is `slides/<slug>/`. Respect an explicit path or established repository convention. The generated `template.json` records the selected preset, palette, typography, pattern, layout system, and output format.

| Format | Minimum deliverable |
| --- | --- |
| HTML | `index.html`, `theme.css`, `slides.js`, `template.json`, `README.md` |
| Marp | `deck.md`, `theme.css`, `template.json`, `README.md` |
| PPTX | `deck.mjs`, `package.json`, `template.json`, `README.md`; generate the `.pptx` when dependency installation is permitted |

Keep assets inside the deck directory.

For every custom Python SVG, keep the plan, generator, and output together:

```text
assets/<visual>.visual.md
assets/<visual>.py
assets/<visual>.svg
```

The Markdown plan records the source of truth, semantic model, composition, eye path, accessibility, editable slide content, and validation contract. Keep it synchronized with the Python and generated SVG.

## 7. Author the deck

Use the selected template as a visual language, not as a fixed page structure. Preserve its color, typography, grid, spacing, and component behavior while changing the layout according to each page's communication role.

Content rules:

- One idea per page.
- Use claim-style headlines rather than labels such as “Overview” or “Architecture”.
- Prefer diagrams, numbers, timelines, comparisons, short code, screenshots, and quotations over bullet walls.
- Keep most pages below roughly 35 visible words. Dense reference pages are an explicit exception.
- Put nuance, caveats, transitions, and secondary evidence in speaker notes.
- Use useful alt text and text equivalents for meaningful visuals.
- Never fabricate logos, customer names, benchmarks, citations, product screenshots, or research findings.
- Do not use private or copyrighted assets without authorization and attribution.

Cover rules:

- Keep the title and audience promise dominant. The right half is optional; whitespace is a valid and often preferable design decision.
- If the right half is used, include exactly one meaningful module: a sourced artifact, a compact proof rail, one operational signal, or a tiny direct system cue.
- Never invent a generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagram merely to fill space.
- A cover visual must be understandable within two seconds, remain secondary to the title, and be readable from the back of the room.
- Prefer removing a weak visual over adding decorative complexity.
- A proof rail must give every number a semantic role and explain the relationship between the signals; mixed dates must remain explicit.
- For mechanism-led topics, hand off to a dedicated next-page diagram rather than expanding the cover rail into a dashboard.

Diagram Design integration:

- When a slide needs a standalone architecture, flowchart, sequence, state, ER, timeline, swimlane, quadrant, loop, chart, data-flow, or security diagram, prefer the `diagram-design` skill rather than rebuilding generic boxes in the deck template.
- For a presentation, set the diagram's size to `slide-16x9` when the content fits; otherwise use the smallest readable preset and split the visual. Keep the slide title, explanation, source note, and speaker notes editable outside the SVG.
- Follow the diagram skill's type reference and self-check. Use its Mermaid/draw.io extractors for redraws; do not render source layouts unchanged.

Custom Python SVG rules:

- Read the bundled Python SVG authoring protocol before implementing a content-specific visual.
- Default to a custom deck-local Python script when the visual model is unique to the source material; do not force the story into a built-in `--kind`.
- Write or update `<visual>.visual.md` before changing geometry in `<visual>.py`.
- Keep the slide title, explanation, source note, footer, and speaker notes editable outside the SVG whenever possible.
- Prefer standard-library, deterministic SVG with a stable `viewBox`, accessible `<title>` and `<desc>`, escaped text, and no external script or absolute local path.
- Promote a one-off visual into the shared generator only after the pattern proves reusable across unrelated decks.

Technical-deck rules:

- Show system, trust, data-ownership, and operational boundaries.
- Label protocols, identities, stores, control plane, data plane, and failure paths.
- Separate current state, target state, and migration plan.
- Cover security, operability, cost, performance, maintainability, and tradeoffs when relevant.
- Keep code samples short and projection-safe.

Format markers:

- HTML: set `data-layout="<archetype>"` on every slide.
- Marp: assign a matching slide class such as `<!-- _class: metric-spotlight -->`.
- PPTX: keep an explicit `LAYOUT_SEQUENCE` array and use editable text and shapes.

## 8. Validate and improve

Run:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" check <deck-path>
```

Then use the sibling `deck-reviewer` skill when available. Fix high-confidence Critical and Major findings and re-run validation.

Verify the format-specific output:

- HTML: keyboard, click and swipe navigation; hash state; viewport scaling; notes; reduced motion; print-to-PDF; local assets; meaningful layout markers.
- Marp: frontmatter; separators; theme loading; layout classes; asset paths; HTML/PDF export.
- PPTX: generation succeeds; wide layout; editable elements; speaker notes; text bounds; portable fonts; deterministic filename; explicit layout sequence.
- Custom Python SVG: the `.visual.md`, `.py`, and `.svg` agree; the Python compiles; the SVG parses; regeneration is deterministic; labels, sources, dates, and units match the source of truth.

## 9. Hand off

Report:

- deck path, format, selected template, and layout diversity summary
- slide count and unique archetype count
- preview or export command
- unresolved assumptions, missing assets, or validation limitations

Do not bury the deliverable under a long process summary.
