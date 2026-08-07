# Claude Code Slides — Agent Plugins + Codex + Claude Code

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![Agent Plugins 1.0](https://img.shields.io/badge/Agent%20Plugins-1.0.0-211f1b.svg)](https://agent-plugins.org/specification)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

A portable presentation plugin that turns topics, documents, URLs, and repositories into clear, modern, story-driven **HTML, Marp, and editable PowerPoint decks**.

The portable core follows the Agent Plugins 1.0.0 package model and Agent Skills conventions. Native adapters preserve first-class installation and invocation in Codex and Claude Code.

> Independent community project. Not affiliated with or endorsed by Anthropic or OpenAI.

[繁體中文說明](./README.zh-TW.md)

![Claude Code-inspired presentation example](./docs/images/hero.svg)

## Portable core

The root manifest targets:

```text
https://agent-plugins.org/schemas/1.0.0/plugin.schema.json
```

Portable components live in fixed locations:

```text
plugin.json
skills/*/SKILL.md
```

This project does not currently ship an MCP server, so `mcp.json` is intentionally absent.

Every Skill references only resources bundled under its own `references/` and `scripts/` directories. Canonical shared references remain under root `references/` and are synchronized with:

```bash
npm run sync:skills
npm run check:skills
```

Agent Plugins 1.0.0 is currently a Working Draft. Codex and Claude Code adapters remain additive compatibility layers.

## One workflow, multiple hosts

| Capability | Portable Skill | Codex | Claude Code |
| --- | --- | --- | --- |
| Create a deck | `create-deck` | `$create-deck` | `/claude-code-slides:create-deck` |
| Review and repair | `review-deck` | `$review-deck` | `/claude-code-slides:review-deck` |
| Speaker notes | `speaker-notes` | `$speaker-notes` | `/claude-code-slides:speaker-notes` |
| Visual system | `claude-code-style` | `$claude-code-style` | `/claude-code-slides:claude-code-style` |
| Narrative plan | `deck-architect` | `$deck-architect` | Skill or `deck-architect` subagent |
| Visual direction | `visual-director` | `$visual-director` | Skill or `visual-director` subagent |
| Independent review | `deck-reviewer` | `$deck-reviewer` | Skill or `deck-reviewer` subagent |

## Install in Codex

Use the full Git URL so Codex configures a refreshable Git marketplace:

```bash
codex plugin marketplace add https://github.com/rufushsu9987/claude-code-slides.git --ref main
codex plugin marketplace upgrade rufus-slides
codex plugin add claude-code-slides@rufus-slides
```

Start a new Codex session after installation:

```text
$create-deck Build a 12-minute Traditional Chinese architecture review from this repository using PPTX.
```

When an older snapshot causes `no matches`:

```bash
codex plugin marketplace remove rufus-slides
rm -rf "$HOME/.codex/.tmp/marketplaces/rufus-slides"
codex plugin marketplace add https://github.com/rufushsu9987/claude-code-slides.git --ref main
codex plugin list --marketplace rufus-slides --available --json
codex plugin add claude-code-slides@rufus-slides
```

## Install in Claude Code

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

Example:

```text
/claude-code-slides:create-deck Build a 12-minute Traditional Chinese architecture review from this repository using PPTX.
```

Update an existing installation:

```bash
claude plugin marketplace update rufus-slides
claude plugin update claude-code-slides@rufus-slides
```

## Use with another Agent Plugins client

Load the repository root as an Agent Plugin directory. A conforming Skills-capable client reads `plugin.json` and discovers each immediate `skills/*/SKILL.md` child.

Distribution, installation, enablement, permissions, updates, and UI remain client-managed.

## Output formats

| Format | Best for | Generated files |
| --- | --- | --- |
| **HTML** | Live talks, strong design fidelity, offline playback, browser sharing, PDF printing | `index.html`, `theme.css`, `slides.js`, `README.md` |
| **Marp** | Markdown review, Git diffs, maintainable docs, quick PDF export | `deck.md`, `theme.css`, `README.md` |
| **PPTX** | Editable Office delivery and corporate handoff | `deck.mjs`, `package.json`, `README.md`, generated `.pptx` |

HTML is the default when the request does not imply another format.

## Example prompts

```text
$create-deck Turn this repository into a 10-slide enterprise architecture review. Use Traditional Chinese and PPTX.

$review-deck Review slides/enterprise-ai-platform, fix Critical and Major issues, and preserve the current brand.

$speaker-notes Add a 15-minute Traditional Chinese talk track with demo cues and likely Q&A.
```

Claude Code equivalents use the `/claude-code-slides:<skill>` namespace.

## CLI

Skill-local `scripts/slides-cli.mjs` wrappers locate the bundled CLI without requiring a global installation.

```bash
node bin/codex-slides.mjs init "Enterprise AI Platform" --format html
node bin/codex-slides.mjs init "Quarterly Review" --format marp
node bin/codex-slides.mjs init "Executive Proposal" --format pptx
node bin/codex-slides.mjs check examples/ai-platform
node bin/codex-slides.mjs doctor
```

With `npm link`:

```bash
codex-slides init "Enterprise AI Platform" --format pptx
claude-slides check examples/ai-platform --json
```

## Development and validation

```bash
npm ci
npm run sync:skills
npm run check
```

The checks cover the closed Agent Plugins v1 manifest, cross-platform version synchronization, fixed `skills/` discovery, Skill-relative resources, generated resource synchronization, both native adapters, and HTML/Marp/PPTX regression tests.

Optional host validation:

```bash
claude plugin validate .
claude --plugin-dir .
codex
```

## Repository layout

```text
plugin.json                         Agent Plugins 1.0 portable manifest
skills/                             portable Agent Skills
references/                         canonical shared authoring references
scripts/sync-skill-resources.mjs    generated-resource synchronizer

.codex-plugin/                      Codex native adapter
.agents/plugins/                    Codex marketplace
.agents/skills/                     Codex repository forwarders

.claude-plugin/                     Claude Code native adapter and marketplace
agents/                             Claude Code subagents

bin/ + lib/                         zero-dependency deck CLI
templates/                          HTML, Marp, and PptxGenJS starters
examples/                           runnable example decks
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
