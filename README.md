# Claude Code Slides — Codex + Claude Code

[![CI](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml/badge.svg)](https://github.com/rufushsu9987/claude-code-slides/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-211f1b.svg)](./LICENSE)

A dual-platform presentation plugin that turns topics, documents, URLs, and repositories into **clear, modern, story-driven HTML, Marp, and editable PowerPoint decks**.

The built-in visual direction uses warm ivory, charcoal typography, restrained terracotta, editorial headlines, and functional terminal details. It is an independent community project and is not affiliated with or endorsed by Anthropic or OpenAI.

[繁體中文說明](./README.zh-TW.md)

![Claude Code-inspired presentation example](./docs/images/hero.svg)

## One workflow, two agent platforms

The authoritative workflows live once under `skills/`. Codex and Claude Code load the same presentation logic through their native plugin systems.

| Capability | Codex | Claude Code |
| --- | --- | --- |
| Create a deck | `$create-deck` | `/claude-code-slides:create-deck` |
| Review and fix | `$review-deck` | `/claude-code-slides:review-deck` |
| Speaker notes | `$speaker-notes` | `/claude-code-slides:speaker-notes` |
| Visual system | `$claude-code-style` | `/claude-code-slides:claude-code-style` |
| Narrative planning | `$deck-architect` | skill or `deck-architect` subagent |
| Visual direction | `$visual-director` | skill or `visual-director` subagent |
| Independent review | `$deck-reviewer` | skill or `deck-reviewer` subagent |

The repository also includes a zero-dependency Node.js CLI for scaffolding and deterministic validation.

## Install in Codex

Add or refresh the repository marketplace, then install the plugin:

```bash
codex plugin marketplace add rufushsu9987/claude-code-slides --ref main
codex plugin marketplace upgrade rufus-slides
codex plugin add claude-code-slides@rufus-slides
```

You can also open `/plugins`, select **Rufus Slides**, and install **Claude Code Slides**. Start a new Codex session after installation.

```text
$create-deck Build a 12-minute Traditional Chinese architecture review for cloud engineers from docs/architecture.md using HTML.
```

### Codex marketplace troubleshooting

If `/plugins` shows **no matches**, refresh the installed marketplace snapshot:

```bash
codex plugin marketplace upgrade rufus-slides
codex plugin list --marketplace rufus-slides --available --json
codex plugin add claude-code-slides@rufus-slides
```

If the snapshot is still stale:

```bash
codex plugin marketplace remove rufus-slides
codex plugin marketplace add rufushsu9987/claude-code-slides --ref main
codex plugin add claude-code-slides@rufus-slides
```

## Install in Claude Code

Add the marketplace and install the plugin:

```bash
claude plugin marketplace add rufushsu9987/claude-code-slides
claude plugin install claude-code-slides@rufus-slides
```

Or run the equivalent commands inside Claude Code:

```text
/plugin marketplace add rufushsu9987/claude-code-slides
/plugin install claude-code-slides@rufus-slides
/reload-plugins
```

Invoke a namespaced skill:

```text
/claude-code-slides:create-deck Build a 12-minute Traditional Chinese architecture review for cloud engineers from docs/architecture.md using HTML.
```

Claude Code automatically discovers the three bundled subagents under `/agents` and can delegate narrative planning, visual direction, and final review to them.

Update an existing installation with:

```bash
claude plugin marketplace update rufus-slides
claude plugin update claude-code-slides@rufus-slides
```

## Develop or test directly from the repository

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run check
```

Codex repository mode:

```bash
codex
# use /skills
```

Claude Code local plugin mode:

```bash
claude plugin validate .
claude --plugin-dir .
```

Codex discovers `.agents/skills/`; Claude Code loads `.claude-plugin/`, root `skills/`, root `agents/`, and the executables in `bin/`.

## Output formats

| Format | Best for | Generated files |
| --- | --- | --- |
| **HTML** | Live talks, strong design fidelity, offline playback, browser sharing, PDF printing | `index.html`, `theme.css`, `slides.js`, `README.md` |
| **Marp** | Markdown review, Git diffs, maintainable docs, quick PDF export | `deck.md`, `theme.css`, `README.md` |
| **PPTX** | Editable Office delivery and corporate handoff | `deck.mjs`, `package.json`, `README.md`, generated `.pptx` |

HTML is the default when the request does not imply another format.

## Example prompts

Codex:

```text
$create-deck Turn this repository into a 10-slide enterprise architecture review for cloud engineers. Use Traditional Chinese and HTML.

$review-deck Review slides/enterprise-ai-platform, fix Critical and Major issues, and preserve the current brand.

$speaker-notes Add a 15-minute Traditional Chinese talk track with demo cues and likely Q&A.
```

Claude Code:

```text
/claude-code-slides:create-deck Turn this repository into a 10-slide enterprise architecture review for cloud engineers. Use Traditional Chinese and HTML.

/claude-code-slides:review-deck Review slides/enterprise-ai-platform and fix Critical and Major issues.

/claude-code-slides:speaker-notes Add a 15-minute Traditional Chinese talk track with demo cues and likely Q&A.
```

## CLI

The skills call the bundled CLI by its plugin-root path, so no global installation is required.

```bash
node bin/codex-slides.mjs init "Enterprise AI Platform" --format html
node bin/codex-slides.mjs init "Quarterly Review" --format marp
node bin/codex-slides.mjs init "Executive Proposal" --format pptx
node bin/codex-slides.mjs check examples/ai-platform
node bin/codex-slides.mjs doctor
```

With `npm link`, both aliases are available:

```bash
codex-slides init "Enterprise AI Platform" --format html
claude-slides check examples/ai-platform --json
```

`doctor` reports Node.js, Codex CLI, Claude Code CLI, and `npx` availability.

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
claude plugin validate .
```

The validator checks:

- synchronized Codex, Claude Code, package, and marketplace versions
- shared Skill metadata, Codex forwarders, and Claude Code subagents
- missing slides, assets, files, or unresolved template tokens
- duplicate HTML IDs, alt text, keyboard controls, hash state, print CSS, and reduced motion
- Marp frontmatter, theme configuration, and asset paths
- PptxGenJS wide layout, generation, dependencies, and editable output

## Repository layout

```text
.codex-plugin/        Codex plugin manifest
.agents/plugins/      Codex repository marketplace
.agents/skills/       Codex repo-scoped skill forwarders
.claude-plugin/       Claude Code plugin manifest and marketplace
skills/               shared cross-platform workflows
agents/               Claude Code subagents
references/           storytelling, style, format, and review guidance
bin/ + lib/           codex-slides and claude-slides CLI
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
- no Anthropic or OpenAI logos, copied product screenshots, or claims of official association

A supplied brand system always takes precedence.

## License

MIT
