# Claude Code Slides

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![Agent Plugins](https://img.shields.io/badge/Agent%20Plugins-1.0.0-211f1b.svg)](https://agent-plugins.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

**Agent-first presentation workflows for Codex, Claude Code, and Agent Plugins-compatible clients.**

Turn a topic, document, URL, or repository into a story-driven HTML, Marp, or editable PowerPoint deck. Claude Code Slides plans the narrative, chooses a visual theme and semantic layout sequence, creates the files, validates the result, reviews delivery quality, and can add speaker notes.

Visual Grammar v2 keeps one coherent design language while varying **composition, geometry, density, and eye path**—so a deck does not merely rename the same left-copy/right-card layout twenty times.

[繁體中文](./README.zh-TW.md) · [Theme and layout gallery](./docs/templates.md) · [Visual Grammar v2 follow-up](https://github.com/rufushsu9987/claude-code-slides/issues/4)

![Claude Code Slides example](./docs/images/hero.svg)

## Highlights

- **Agent-first workflow:** narrative planning, visual direction, generation, deterministic checks, independent review, and speaker notes.
- **7 visual themes:** one shared workflow for technical, executive, cloud, data, product, terminal, and incident presentations.
- **28 semantic layout archetypes:** layouts are selected by the communication job of each slide.
- **20 distinct starter layouts and geometries:** the starter decks demonstrate real composition changes rather than cosmetic card variations.
- **10 deterministic SVG drawing kinds:** dependency-free Python visuals with `sketch` and `clean` styles.
- **Three output formats:** interactive HTML, reviewable Marp, and editable PPTX built with text and shapes.
- **Portable plugin architecture:** shared Agent Skills with native Codex and Claude Code adapters.

## How it works

Claude Code Slides is not a one-shot “split this document into ten pages” prompt. It packages a repeatable presentation workflow:

```text
source material
  → audience, decision, and constraints
  → narrative architecture
  → visual theme + semantic layout sequence
  → geometry-aware page composition
  → HTML / Marp / editable PPTX
  → deterministic validation
  → independent review
  → speaker notes and Q&A preparation
```

The portable core follows [Agent Plugins 1.0.0](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json) and Agent Skills conventions. Native adapters preserve the best installation and invocation experience in Codex and Claude Code.

## Quick start

Create a deck with the default `claude-editorial` theme:

```bash
codex-slides init "AI Platform Architecture Review" --format html
```

Create an editable PowerPoint deck with an explicit theme:

```bash
codex-slides init "Quarterly Strategy Review" \
  --format pptx \
  --template executive-brief
```

Inspect the available themes and layouts:

```bash
codex-slides templates
codex-slides layouts
codex-slides layouts --family system --json
```

Validate a generated deck:

```bash
codex-slides check slides/ai-platform-architecture-review
```

`claude-slides` exposes the same CLI.

## Visual Grammar v2

Visual Grammar v2 separates four concerns that are often collapsed into a single template:

| Layer | Controls | Example |
| --- | --- | --- |
| **Theme** | Color, typography, surface treatment, background pattern | `claude-editorial`, `cloud-architecture` |
| **Layout archetype** | The communication job and information hierarchy | `system-map`, `decision-path`, `quote-evidence` |
| **Geometry** | Composition, dominant element, density, and eye path | `hub-and-spoke`, `branch-path`, `quote-stage` |
| **Visual asset** | Optional reusable SVG illustration or diagram | `agent-journey`, `operating-loop` |

This distinction prevents false variety: two slides may use different labels while still looking identical in the thumbnail view. The layout catalog therefore records fields such as `dominantElement`, `eyePath`, `density`, `geometry`, `variants`, and `avoid` in addition to the semantic family and recommended use cases.

### Layout families

| Family | Archetypes |
| --- | --- |
| Opening | `editorial-cover`, `chapter-index` |
| Statement and explanation | `hero-statement`, `asymmetric-editorial`, `split-narrative` |
| Evidence | `metric-spotlight`, `evidence-claim`, `annotated-visual`, `quote-evidence`, `infographic-story`, `data-journey`, `dashboard-story` |
| System | `layered-architecture`, `flow-architecture`, `system-map`, `architecture-boundary` |
| Comparison and decision | `before-after`, `comparison-matrix`, `decision-path`, `decision` |
| Sequence | `timeline`, `roadmap-horizon`, `process-steps`, `swimlane-process`, `operating-loop` |
| Demonstration, risk, and close | `code-walkthrough`, `risk-matrix`, `closing-manifesto` |

The default starter deck demonstrates this 20-page sequence:

```text
editorial-cover
→ hero-statement
→ chapter-index
→ before-after
→ layered-architecture
→ metric-spotlight
→ system-map
→ evidence-claim
→ flow-architecture
→ annotated-visual
→ infographic-story
→ code-walkthrough
→ data-journey
→ quote-evidence
→ comparison-matrix
→ decision-path
→ operating-loop
→ timeline
→ risk-matrix
→ closing-manifesto
```

The catalog also defines deck-level guidance such as:

- at least 8 distinct archetypes in a deck of 10 or more slides when the content supports them
- no exact consecutive layout repetition
- card-based pages at or below roughly 20%
- split-screen pages at or below roughly 35%
- no more than 2 consecutive pages with the same underlying geometry
- a visible rhythm change about every 3 slides
- one explicit dominant element per page

Layout choices remain inspectable in every output format:

```text
HTML  data-layout="system-map" data-geometry="hub-and-spoke"
Marp  <!-- _class: system-map -->
PPTX  LAYOUT_SEQUENCE + GEOMETRY_SEQUENCE
```

## Seven visual themes

The default theme is `claude-editorial`. The previous name `terminal-editorial` remains a compatible alias.

| Theme | Best for |
| --- | --- |
| `claude-editorial` | Technical talks, architecture reviews, AI and developer tooling |
| `executive-brief` | Leadership updates, strategy proposals, quarterly reviews |
| `cloud-architecture` | Infrastructure, platform engineering, security boundaries |
| `data-story` | Analytics, research findings, metrics, and comparisons |
| `product-launch` | Product demos, launches, roadmaps, and feature narratives |
| `dark-terminal` | Live demos, code walkthroughs, and engineering deep dives |
| `incident-review` | Postmortems, impact timelines, root cause, and remediation |

Omitting `--template` uses `claude-editorial`.

Each generated deck includes `template.json`, which records the selected theme, aliases, design tokens, layout-system rules, starter sequence, and output format.

## Python-assisted SVG graphics

Use the dependency-free Python generator when a slide needs a reusable vector illustration rather than a screenshot or a rasterized full-page image.

List the built-in drawing kinds:

```bash
python3 scripts/generate-slide-art.py --list-kinds
```

Available CLI kinds:

```text
agent-journey
architecture-boundary
data-journey
decision-path
infographic
mechanism-loop
operating-loop
roadmap-horizon
swimlane-process
system-map
```

`infographic` remains a compatible entry point for the `agent-journey` visual story. `mechanism-loop` is a configurable four-stage causal loop intended for an explanatory page after the cover—not as automatic cover decoration.

Create a content-specific mechanism loop:

```bash
python3 scripts/generate-slide-art.py \
  --kind mechanism-loop \
  --style clean \
  --center-eyebrow "CAPITAL ENGINE" \
  --center-label "BTC per share" \
  --step "FINANCE|debt / equity" \
  --step "BUY BTC|asset base" \
  --step "RE-RATE|market access" \
  --step "REFINANCE|repeat" \
  --rail "Asset base|BTC holdings" \
  --rail "Liquidity|cash reserve" \
  --rail "Per-share effect|BTC yield" \
  --takeaway "Capital access keeps the accumulation loop moving." \
  --output slides/example/assets/capital-engine.svg
```

Create a hand-drawn visual inspired by whiteboard storytelling:

```bash
python3 scripts/generate-slide-art.py \
  --kind agent-journey \
  --style sketch \
  --seed 42 \
  --title "From scattered context to visible progress" \
  --output slides/example/assets/agent-journey.svg
```

Create a cleaner enterprise architecture visual without a visible caption rail:

```bash
python3 scripts/generate-slide-art.py \
  --kind system-map \
  --style clean \
  --hide-caption \
  --title "AI Agent Platform Architecture" \
  --output slides/example/assets/system-map.svg
```

Customize the palette or produce a transparent asset:

```bash
python3 scripts/generate-slide-art.py \
  --kind architecture-boundary \
  --style clean \
  --accent '#0078A8' \
  --canvas '#EEF7FB' \
  --transparent \
  --hide-caption \
  --output slides/example/assets/trust-boundary.svg
```

The generator uses only the Python standard library. It emits deterministic SVG with a stable `viewBox`, accessible `<title>` and `<desc>` metadata, no local file paths, and no external runtime dependency.

## Skills

| Capability | Codex | Claude Code |
| --- | --- | --- |
| Create a deck | `$create-deck` | `/claude-code-slides:create-deck` |
| Review and improve | `$review-deck` | `/claude-code-slides:review-deck` |
| Add speaker notes | `$speaker-notes` | `/claude-code-slides:speaker-notes` |
| Apply the visual system | `$claude-code-style` | `/claude-code-slides:claude-code-style` |
| Plan the narrative | `$deck-architect` | Skill or `deck-architect` subagent |
| Direct the visuals | `$visual-director` | Skill or `visual-director` subagent |
| Run an independent audit | `$deck-reviewer` | Skill or `deck-reviewer` subagent |

## Install in Codex

```bash
codex plugin marketplace add \
  https://github.com/rufushsu9987/claude-code-slides.git \
  --ref main

codex plugin add claude-code-slides@rufus-slides
```

Start a new Codex session, then run:

```text
$create-deck

Analyze this repository and create a 10-slide Traditional Chinese architecture review.
Use editable PPTX and the default claude-editorial theme.
Use at least eight distinct layout archetypes and cover data flow, trust boundaries,
deployment, operations, risks, and next steps.
```

For an existing Git marketplace snapshot:

```bash
codex plugin marketplace upgrade rufus-slides
```

When Codex reports that the marketplace is not configured as Git, remove and re-add it with the full GitHub URL shown above.

## Install in Claude Code

```bash
claude plugin marketplace add rufushsu9987/claude-code-slides
claude plugin install claude-code-slides@rufus-slides
```

Then run:

```text
/claude-code-slides:create-deck

Turn docs/architecture.md into a 12-minute architecture review.
Use editable PPTX, the default claude-editorial theme, and a varied layout sequence.
```

After updating the plugin, start a new session or run `/reload-plugins`.

## Output formats

| Format | Best use | Output |
| --- | --- | --- |
| HTML | Live delivery, visual fidelity, interaction, offline playback, browser sharing | `index.html`, `theme.css`, `slides.js` |
| Marp | Markdown review, Git diffs, documentation workflows, quick HTML/PDF export | `deck.md`, `theme.css` |
| PPTX | Editable Microsoft PowerPoint and enterprise handoff | `deck.mjs`, generated `.pptx` |

The PPTX workflow uses editable text and shapes rather than flattening every slide into an image. SVG assets remain separate visual anchors, so the surrounding title, explanation, notes, and controls stay editable.

## CLI

```bash
codex-slides templates
codex-slides templates --format pptx --json
codex-slides layouts
codex-slides layouts --family evidence --json
codex-slides init "AI Platform" --format html
codex-slides init "Cloud Review" --format pptx --template cloud-architecture
codex-slides check slides/cloud-review
codex-slides doctor
```

`claude-slides` exposes the same interface.

## Repository architecture

```text
plugin.json                     Agent Plugins portable manifest
skills/                         portable Agent Skills
references/layout-system.md     semantic and geometry-aware layout rules
templates/catalog.json          visual theme catalog
templates/layouts.json          28 layout archetypes and starter sequence
scripts/generate-slide-art.py   deterministic SVG visual generator
.codex-plugin/                  Codex adapter
.agents/plugins/                Codex marketplace
.agents/skills/                 repository-scoped Codex discovery
.claude-plugin/                 Claude Code manifest and marketplace
agents/                         Claude Code subagents
bin/ + lib/                     zero-dependency scaffolding and validation CLI
templates/                      HTML, Marp, and PptxGenJS bases
```

## Development

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run sync:skills
npm run check
```

The test and smoke-test workflow:

- scaffolds all 7 themes in HTML, Marp, and PPTX
- validates the portable and native plugin manifests
- verifies 28 layout archetypes and 20 distinct starter layouts/geometries
- exercises all 9 SVG kinds in both `sketch` and `clean` modes
- checks deterministic output, portable paths, accessibility metadata, and invalid input handling
- checks skill-resource synchronization and the runnable example deck

Remaining metadata, validator, gallery, and visual-regression work is tracked in [issue #4](https://github.com/rufushsu9987/claude-code-slides/issues/4).

## Independence

This is an independent community project. It is not maintained, endorsed, or affiliated with Anthropic or OpenAI. The name describes the bundled developer-tool-inspired presentation direction; no official logos or proprietary product UI are included.

## License

MIT
