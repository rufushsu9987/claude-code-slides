# Claude Code Slides

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![Agent Plugins](https://img.shields.io/badge/Agent%20Plugins-1.0.0-211f1b.svg)](https://agent-plugins.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

**Agent-first presentation workflows for Codex, Claude Code, and Agent Plugins-compatible clients.**

Turn a topic, document, URL, or repository into a story-driven HTML, Marp, or editable PowerPoint deck. The plugin plans the narrative, selects a visual theme and content-aware layout sequence, creates the files, validates the output, reviews delivery quality, and can add speaker notes.

[繁體中文](./README.zh-TW.md) · [Theme and layout gallery](./docs/templates.md)

![Claude Code Slides example](./docs/images/hero.svg)

## What makes it different

Claude Code Slides is not a one-shot “split this document into ten pages” prompt. It packages a repeatable workflow:

```text
source material
  → audience and decision
  → narrative architecture
  → visual theme + semantic layout sequence
  → HTML / Marp / editable PPTX
  → deterministic validation
  → independent review
  → speaker notes and Q&A
```

The portable core follows [Agent Plugins 1.0.0](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json) and Agent Skills conventions. Native adapters preserve the best installation and invocation experience in Codex and Claude Code.

## Seven visual themes, nineteen layout archetypes

A **theme** controls color, typography, surfaces, and background treatment. A **layout archetype** controls information architecture: what dominates the page, how the eye moves, and how the content is compared or sequenced.

The default theme is `claude-editorial`. The previous name `terminal-editorial` remains a compatible alias.

| Theme | Best for |
| --- | --- |
| `claude-editorial` | Technical talks, architecture reviews, AI and developer tooling |
| `executive-brief` | Leadership updates, strategy proposals, quarterly reviews |
| `cloud-architecture` | Infrastructure, platform engineering, security boundaries |
| `data-story` | Analytics, research findings, metrics and comparisons |
| `product-launch` | Product demos, launches, roadmaps and feature narratives |
| `dark-terminal` | Live demos, code walkthroughs and engineering deep dives |
| `incident-review` | Postmortems, impact timelines, root cause and remediation |

The layout system includes 19 archetypes such as `hero-statement`, `before-after`, `layered-architecture`, `flow-architecture`, `metric-spotlight`, `evidence-claim`, `infographic-story`, `data-journey`, `decision-path`, `comparison-matrix`, `timeline`, `risk-matrix`, and `closing-manifesto`.

The starter deck now demonstrates **15 distinct layouts instead of repeating 3–4 structures**. For decks of 10 or more slides, the workflow targets at least eight distinct archetypes, prevents consecutive repeats, limits card-grid pages to roughly 20%, and introduces a visible rhythm change every three to four slides.

List the installed themes and layouts:

```bash
codex-slides templates
codex-slides layouts
codex-slides layouts --family system --json
```

Create a deck with an explicit theme:

```bash
codex-slides init "Quarterly Strategy Review" \
  --format pptx \
  --template executive-brief
```

Omitting `--template` uses `claude-editorial`.

Each generated deck includes `template.json`, which records the selected theme, aliases, design tokens, layout-system rules, starter sequence, and output format.

## Python-assisted slide graphics

Use the dependency-free Python generator when a slide needs a small reusable vector illustration rather than a screenshot:

```bash
python3 scripts/generate-slide-art.py \
  --kind infographic \
  --title "From scattered inputs to a ready deck" \
  --output slides/example/assets/infographic-story.svg
```

Available drawing kinds are `infographic`, `data-journey`, and `decision-path`. The output is deterministic SVG with a stable `viewBox`, so it can be embedded in HTML or Marp and inserted as an editable-deck asset without turning the whole slide into a raster image.

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
| HTML | Live delivery, strong visual fidelity, offline playback, browser sharing | `index.html`, `theme.css`, `slides.js` |
| Marp | Markdown review, Git diffs, quick HTML/PDF generation | `deck.md`, `theme.css` |
| PPTX | Editable Microsoft PowerPoint and enterprise handoff | `deck.mjs`, generated `.pptx` |

The PPTX workflow uses editable text and shapes rather than flattening each page into an image.

Layout markers remain reviewable in every format:

- HTML: `data-layout="..."`
- Marp: `<!-- _class: ... -->`
- PPTX: `LAYOUT_SEQUENCE`

## CLI

```bash
codex-slides templates
codex-slides layouts
codex-slides init "AI Platform" --format html
codex-slides init "Cloud Review" --format pptx --template cloud-architecture
codex-slides check slides/cloud-review
codex-slides doctor
```

`claude-slides` exposes the same interface.

## Repository architecture

```text
plugin.json                 Agent Plugins portable manifest
skills/                     portable Agent Skills
references/layout-system.md semantic layout rules
templates/catalog.json      visual theme catalog
templates/layouts.json      layout archetype catalog
.codex-plugin/              Codex adapter
.agents/plugins/            Codex marketplace
.agents/skills/             repository-scoped Codex discovery
.claude-plugin/             Claude Code manifest and marketplace
agents/                     Claude Code subagents
bin/ + lib/                 zero-dependency scaffolding and validation CLI
templates/                  HTML, Marp and PptxGenJS bases
```

## Development

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run sync:skills
npm run check
```

The test suite scaffolds every theme in all three formats, validates portable and native manifests, verifies the 19-layout catalog, confirms 15 unique starter layouts, checks skill-resource synchronization, and validates the runnable example deck.

## Independence

This is an independent community project. It is not maintained, endorsed, or affiliated with Anthropic or OpenAI. The name describes the bundled developer-tool-inspired presentation direction; no official logos or proprietary product UI are included.

## License

MIT
