# Claude Code Slides for Codex

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

A Codex plugin that turns topics, documents, URLs, and repositories into **clear, modern, story-driven presentations**.

The name describes the built-in visual direction: warm ivory, charcoal typography, restrained terracotta, editorial headlines, and functional terminal details. It is an independent community project and is not affiliated with or endorsed by Anthropic or OpenAI.

[繁體中文說明](./README.zh-TW.md)

![Claude Code-inspired presentation example](./docs/images/hero.svg)

## What it includes

| Skill | Purpose |
| --- | --- |
| `$create-deck` | Create a complete HTML, Marp, or editable PowerPoint deck |
| `$review-deck` | Audit or fix narrative, density, hierarchy, accessibility, assets, and export readiness |
| `$speaker-notes` | Add timing, talk tracks, transitions, demo cues, caveats, and likely Q&A |
| `$claude-code-style` | Apply the warm terminal-editorial visual system |
| `$deck-architect` | Plan audience journey, thesis, evidence, and page sequence |
| `$visual-director` | Plan page composition, diagrams, hierarchy, and visual consistency |
| `$deck-reviewer` | Run an independent delivery review |

It also includes a zero-dependency Node.js CLI for scaffolding and deterministic validation.

## Install in Codex

Add the repository marketplace:

```bash
codex plugin marketplace add rufushsu9987/claude-code-slides --ref main
```

Start Codex, open the plugin browser, and install **Claude Code Slides**:

```text
/plugins
```

Start a new Codex session after installation. Then invoke a workflow explicitly:

```text
$create-deck Build a 12-minute Traditional Chinese architecture review for cloud engineers from docs/architecture.md using HTML.
```

Codex can also select a skill implicitly when your request matches its description.

## Develop or test directly from the repository

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run check
codex
```

The checked-in `.agents/skills/` forwarders make all seven skills available when Codex is launched anywhere inside the repository. Use `/skills` to inspect them.

## Output formats

| Format | Best for | Generated files |
| --- | --- | --- |
| **HTML** | Live talks, strong design fidelity, offline playback, browser sharing, PDF printing | `index.html`, `theme.css`, `slides.js`, `README.md` |
| **Marp** | Markdown review, Git diffs, maintainable docs, quick PDF export | `deck.md`, `theme.css`, `README.md` |
| **PPTX** | Editable Office delivery and corporate handoff | `deck.mjs`, `package.json`, `README.md`, generated `.pptx` |

HTML is the default when the request does not imply another format.

## Example prompts

```text
$create-deck Turn this repository into a 10-slide enterprise architecture review for cloud engineers. Use Traditional Chinese and HTML.

$review-deck Review slides/enterprise-ai-platform, fix Critical and Major issues, and preserve the current brand.

$speaker-notes Add a 15-minute Traditional Chinese talk track with demo cues and likely Q&A.

$visual-director Propose a Claude Code-inspired visual system for this security architecture deck without copying official product UI.
```

## CLI

The skills call the bundled CLI by absolute path, so no global installation is required. For manual local use:

```bash
node bin/codex-slides.mjs init "Enterprise AI Platform" --format html
node bin/codex-slides.mjs init "Quarterly Review" --format marp
node bin/codex-slides.mjs init "Executive Proposal" --format pptx
node bin/codex-slides.mjs check examples/ai-platform
node bin/codex-slides.mjs doctor
```

With `npm link`, use:

```bash
codex-slides init "Enterprise AI Platform" --format html
codex-slides check examples/ai-platform --json
```

The legacy `claude-slides` command remains an alias.

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

The HTML template preserves its page in the URL hash, scales from a 1920 × 1080 canvas, supports reduced motion, and prints one slide per page.

## Validation

```bash
npm run check
node bin/codex-slides.mjs check examples/ai-platform
```

The validator checks, among other things:

- missing slides, assets, files, or unresolved template tokens
- duplicate HTML IDs and images without useful alt text
- missing headings, notes, print rules, reduced-motion handling, keyboard controls, or hash state
- invalid Marp frontmatter, theme configuration, or asset paths
- missing PptxGenJS setup, wide layout, output writing, slide creation, or package dependency
- invalid Codex plugin, marketplace, skill metadata, or Claude-specific runtime tokens

## Repository layout

```text
.codex-plugin/        Codex plugin manifest
.agents/plugins/      repository marketplace
.agents/skills/       repo-scoped skill forwarders
skills/               Codex workflows and design guidance
references/           storytelling, style, format, and review guidance
bin/ + lib/           codex-slides CLI
templates/            HTML, Marp, and PptxGenJS starters
examples/             runnable example decks
scripts/ + test/      validation and regression tests
```

## Design direction

- warm ivory canvas and charcoal typography
- restrained terracotta emphasis
- editorial serif headlines, readable sans body, and precise mono labels
- terminal chrome only where it communicates workflow or evidence
- direct labels, meaningful geometry, and generous whitespace
- no Anthropic logos, copied product screenshots, or claims of official association

A supplied brand system always takes precedence.

## License

MIT
