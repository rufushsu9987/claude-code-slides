# Theme and layout gallery

Claude Code Slides separates visual **themes** from semantic **layout archetypes**. Every theme supports HTML, Marp, and editable PPTX output, while the layout system changes composition according to the communication job of each slide.

## Discover themes and layouts

```bash
codex-slides templates
codex-slides templates --format pptx --json
codex-slides layouts
codex-slides layouts --family system --json
```

The same commands are available through `claude-slides`.

## Create a deck

```bash
codex-slides init "Cloud Platform Review" \
  --format pptx \
  --template cloud-architecture
```

Omit `--template` to use the default `claude-editorial` theme. The previous `terminal-editorial` name remains an alias.

Every generated deck includes `template.json`, which records the selected theme, design tokens, layout rules, available archetypes, starter sequence, and output format.

## Visual themes

| Theme | Visual direction | Recommended use |
| --- | --- | --- |
| `claude-editorial` | Warm ivory, charcoal, terracotta, editorial typography | Technical talks, architecture reviews, AI and developer tooling |
| `executive-brief` | Clean navy, cobalt emphasis, compact business hierarchy | Leadership updates, strategy proposals, quarterly reviews |
| `cloud-architecture` | Blueprint grid, cyan and navy, precise boundaries | Cloud platforms, infrastructure, security and architecture |
| `data-story` | Calm green editorial system focused on evidence | Analytics, research, metrics and comparison narratives |
| `product-launch` | High-contrast violet with spotlight geometry | Product launches, demos, roadmaps and feature stories |
| `dark-terminal` | Dark developer workspace with warm code accents | Live demos, code walkthroughs and engineering deep dives |
| `incident-review` | Structured red and neutral signal system | Postmortems, incident timelines, root cause and remediation |

## Layout archetypes

| Archetype | Family | Recommended use |
| --- | --- | --- |
| `editorial-cover` | Opening | Cover or section opening |
| `hero-statement` | Statement | Thesis, tension, or big idea |
| `asymmetric-editorial` | Statement | Context, provocation, chapter transition |
| `split-narrative` | Explanation | Claim plus evidence or visual |
| `metric-spotlight` | Evidence | KPI, outcome, or scale |
| `evidence-claim` | Evidence | Research, benchmark, quotation, screenshot |
| `infographic-story` | Evidence | One-glance problem → method → result story |
| `data-journey` | Evidence | Dominant metric plus progress trend |
| `layered-architecture` | System | Platform layers, ownership, trust boundaries |
| `flow-architecture` | System | Data flow, request path, agent workflow |
| `before-after` | Comparison | Migration, transformation, current versus target |
| `comparison-matrix` | Comparison | Technology selection and trade-offs |
| `decision-path` | Decision | Signal → evaluation → proceed or pause |
| `timeline` | Sequence | Roadmap, migration, incident chronology |
| `process-steps` | Sequence | CI/CD, operating model, delivery process |
| `code-walkthrough` | Demonstration | CLI, API, or implementation evidence |
| `risk-matrix` | Risk | Security, delivery risk, readiness |
| `decision` | Decision | Approval, funding, architecture decision |
| `closing-manifesto` | Closing | Final action or memorable conclusion |

## Layout diversity rules

For decks of 10 or more slides:

- Use at least eight distinct archetypes when the content supports them.
- Do not repeat the exact archetype consecutively.
- Do not let one visual family dominate more than two of any three consecutive slides.
- Keep card-grid and node-card pages at or below roughly 20%.
- Introduce a visible rhythm change every three to four slides.
- Interleave editorial, evidence, architecture, sequence, risk, and decision pages.
- Repeat a layout only when the semantic task genuinely repeats.

The base HTML, Marp, and PPTX starters demonstrate this sequence:

```text
editorial-cover
→ hero-statement
→ before-after
→ layered-architecture
→ flow-architecture
→ metric-spotlight
→ evidence-claim
→ infographic-story
→ data-journey
→ code-walkthrough
→ comparison-matrix
→ decision-path
→ timeline
→ risk-matrix
→ closing-manifesto
```

## Format markers

Layout choices remain explicit and reviewable:

```text
HTML  data-layout="metric-spotlight"
Marp  <!-- _class: metric-spotlight -->
PPTX  LAYOUT_SEQUENCE = ['...', 'metric-spotlight', '...']
```

## Adding another visual theme

Add an entry to `templates/catalog.json` with a kebab-case name, optional aliases, display metadata, supported formats, mode, background pattern, the layout system name, and complete palette, font, and shape tokens.

## Adding another layout archetype

Add an entry to `templates/layouts.json` with a kebab-case name, semantic family, description, recommended uses, card-based flag, and supported formats. Then implement the layout in the relevant starter or generation workflow and run:

```bash
npm run sync:skills
npm run check
```

The smoke test scaffolds every theme in HTML, Marp, and PPTX, verifies layout metadata, and rejects repetitive starter sequences.

## Agent-authored Python SVG assets

Because the workflow runs inside Codex and Claude Code, the preferred SVG process is dynamic and plan-backed rather than limited to a fixed renderer catalog.

For each custom visual, create:

```text
assets/<visual>.visual.md
assets/<visual>.py
assets/<visual>.svg
```

Copy [`templates/python-svg-plan.md`](../templates/python-svg-plan.md), complete the audience takeaway, source of truth, semantic model, composition, labels, accessibility, and validation sections, then write a dedicated Python generator. See [`references/python-svg-authoring.md`](../references/python-svg-authoring.md) for the full protocol.

Use `scripts/generate-slide-art.py` when one of its 10 tested reference kinds already fits or when you need a fast starting point. The kinds are examples and fallbacks—not the boundary of the visual system. A content-specific architecture, mechanism, journey, or scene should normally remain a deck-local plan, script, and SVG until it proves broadly reusable.

