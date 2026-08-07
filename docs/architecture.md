# Architecture

Claude Code Slides is a local-first content-and-tooling plugin rather than a hosted application.

## Components

```text
Claude Code
├── skills/
│   ├── create-deck
│   ├── review-deck
│   ├── speaker-notes
│   └── claude-code-style
├── agents/
│   ├── deck-architect
│   ├── visual-director
│   └── deck-reviewer
├── references/
│   ├── style-system.md
│   └── output-formats.md
├── templates/
│   ├── html
│   ├── marp
│   └── pptx
└── bin/claude-slides.mjs
    └── lib/cli.mjs
```

## Creation flow

```text
source material
      │
      ▼
create-deck skill
      ├── deck-architect ── narrative and evidence plan
      ├── visual-director ─ visual and layout plan
      └── claude-slides init ─ deterministic scaffold
      │
      ▼
authored HTML / Marp / PPTX source
      │
      ├── claude-slides check
      └── deck-reviewer
      │
      ▼
validated deliverable + run/export instructions
```

## Design choices

### Local-first and dependency-light

The root plugin uses Node.js standard-library modules only. HTML output has no runtime CDN requirement. Marp is invoked on demand through its CLI, while a generated PowerPoint project declares PptxGenJS locally inside the deck directory.

### Separation of judgment and checks

Skills and subagents handle audience reasoning, narrative, design, and tradeoffs. The CLI handles deterministic structure, asset, accessibility, and format checks. Neither layer replaces the other.

### Multi-format contract

All formats share the same communication principles but retain their native strengths:

- HTML: interaction, responsive playback, offline portability, print-to-PDF.
- Marp: readable Markdown, Git review, repeatable export.
- PPTX: editable Office objects and enterprise handoff.

### Framework preservation

The built-in templates are defaults. When a project already uses Slidev, Reveal.js, React, Marp, a corporate theme, or another established workflow, the skills inspect and preserve it instead of forcing migration.

### Unofficial visual inspiration

The warm terminal-editorial system captures the calm precision of a developer workspace without copying Anthropic trademarks, official logos, proprietary UI, or brand assets.
