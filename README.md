# Claude Code Slides

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

A production-minded Claude Code plugin for turning briefs, source files, URLs, and repositories into **clear, modern, story-driven presentations**.

It combines narrative planning, visual direction, reusable templates, speaker notes, and deterministic checks. The built-in visual language is a warm terminal-editorial system inspired by focused developer tools—not a copy of Anthropic branding.

> Independent community project. Not affiliated with or endorsed by Anthropic.

[繁體中文說明](./README.zh-TW.md)

![Claude Code Slides example deck](./docs/images/hero.svg)

**Build decks like code:** plan the argument, generate an editable artifact, validate it, and refine it without leaving Claude Code.

## What you get

| Surface | Purpose |
| --- | --- |
| `/claude-code-slides:create-deck` | Create a complete HTML, Marp, or editable PowerPoint deck from a topic or source material |
| `/claude-code-slides:review-deck` | Audit or fix narrative, density, hierarchy, accessibility, assets, and export readiness |
| `/claude-code-slides:speaker-notes` | Add timed talk tracks, transitions, demo cues, caveats, and likely Q&A |
| `claude-code-style` | Background design system automatically available to Claude |
| `deck-architect` | Read-only subagent for audience journey, thesis, evidence, and page sequence |
| `visual-director` | Read-only subagent for layout, diagrams, hierarchy, and visual consistency |
| `deck-reviewer` | Independent read-only delivery review |
| `claude-slides` | Zero-dependency CLI for scaffolding and deterministic validation |

## Install

From your terminal:

```bash
claude plugin marketplace add rufushsu9987/claude-code-slides
claude plugin install claude-code-slides@rufus-slides
```

Or inside Claude Code:

```text
/plugin marketplace add rufushsu9987/claude-code-slides
/plugin install claude-code-slides@rufus-slides
/reload-plugins
```

Local development:

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
claude --plugin-dir ./claude-code-slides
```

## Create a deck

```text
/claude-code-slides:create-deck Build a 12-minute Traditional Chinese architecture review for cloud engineers from docs/architecture.md --format html
```

The workflow:

1. Inspect the source material and separate verified facts from assumptions.
2. Define the audience promise, thesis, decision, and page budget.
3. Plan the narrative and visual system with focused subagents when useful.
4. Generate the selected format and local assets.
5. Add speaker notes and delivery cues.
6. Run deterministic checks plus an independent deck review.
7. Fix high-confidence issues before handoff.

## Output formats

| Format | Best for | Generated files |
| --- | --- | --- |
| **HTML** | Live talks, strong design fidelity, offline playback, browser sharing, PDF printing | `index.html`, `theme.css`, `slides.js`, `README.md` |
| **Marp** | Markdown review, Git diffs, low-maintenance docs, quick PDF export | `deck.md`, `theme.css`, `README.md` |
| **PPTX** | Editable Office delivery, corporate handoff, PowerPoint compatibility | `deck.mjs`, `package.json`, `README.md`, generated `.pptx` |

HTML is the default when the request does not imply another format.

## CLI

When the plugin is enabled, `claude-slides` is available to Claude Code's Bash tool. It also works locally through Node:

```bash
node bin/claude-slides.mjs init "Enterprise AI Platform" --format html
node bin/claude-slides.mjs init "Quarterly Review" --format marp
node bin/claude-slides.mjs init "Executive Proposal" --format pptx
node bin/claude-slides.mjs check slides/enterprise-ai-platform
node bin/claude-slides.mjs doctor
```

With `npm link`, use the shorter form:

```bash
claude-slides init "Enterprise AI Platform" --format html
claude-slides check slides/enterprise-ai-platform --json
```

## HTML controls

| Key | Action |
| --- | --- |
| `→`, `↓`, `Space`, `PageDown` | Next slide |
| `←`, `↑`, `PageUp` | Previous slide |
| `Home` / `End` | First / last slide |
| `N` | Toggle speaker notes |
| `F` | Toggle fullscreen |
| `P` | Print or export to PDF |
| Swipe / click | Navigate on touch or pointer devices |

The deck preserves its page in the URL hash, scales from a 1920 × 1080 canvas, supports reduced motion, and prints one slide per page.

## Review and repair

```text
/claude-code-slides:review-deck slides/enterprise-ai-platform --fix
```

The validator detects, among other things:

- missing slides, assets, files, or template tokens
- duplicate HTML IDs and images without useful alt text
- missing headings, notes, print rules, reduced-motion handling, keyboard controls, or hash state
- invalid Marp frontmatter, theme configuration, or asset paths
- missing PptxGenJS setup, wide layout, output writing, slide creation, or package dependency

## Example

A complete example lives in [`examples/ai-platform`](./examples/ai-platform/).

```bash
python3 -m http.server 8000 --directory examples/ai-platform
# open http://localhost:8000

node bin/claude-slides.mjs check examples/ai-platform
```

## Design direction

- warm ivory canvas and charcoal typography
- restrained terracotta emphasis
- editorial serif headlines, readable sans body, and precise mono labels
- terminal chrome only where it communicates workflow or evidence
- direct labels, meaningful geometry, and generous whitespace
- no Anthropic logos, copied product screenshots, or claims of official association

A supplied brand system always takes precedence.

## Repository layout

```text
.claude-plugin/       plugin and marketplace manifests
skills/               user workflows and background design guidance
agents/               focused presentation subagents
references/           format contracts and visual system
bin/ + lib/           claude-slides CLI
scripts/ + test/      validation and regression tests
templates/            HTML, Marp, and PptxGenJS starters
examples/             runnable example decks
```

## Development

```bash
npm test
npm run check
claude plugin validate .
claude --plugin-dir .
```

## License

MIT
