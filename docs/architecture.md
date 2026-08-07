# Architecture

Claude Code Slides is a skills-only Codex plugin with a local, dependency-free Node.js CLI.

## Surfaces

```text
Codex CLI / ChatGPT desktop Codex
        │
        ├─ Marketplace discovery
        │    └─ .agents/plugins/marketplace.json
        │
        ├─ Installed plugin
        │    ├─ .codex-plugin/plugin.json
        │    └─ skills/*/SKILL.md
        │
        └─ Repository development
             └─ .agents/skills/* -> ../../skills/*
```

Codex can select a skill implicitly from its description or explicitly through `$skill-name`. The same workflow files are used for installed-plugin and repository-scoped development.

## Skills

The main delivery skills are:

- `create-deck`
- `review-deck`
- `speaker-notes`

Supporting skills provide design and independent planning passes:

- `claude-code-style`
- `deck-architect`
- `visual-director`
- `deck-reviewer`

Each skill resolves the plugin root from its own `SKILL.md` location. This avoids relying on Claude-specific environment variables or a globally installed command.

## CLI

`bin/codex-slides.mjs` and the compatibility wrapper `bin/claude-slides.mjs` call the same library:

```text
bin/*
  └─ lib/cli.mjs
       ├─ lib/runtime.mjs   template scaffolding and diagnostics
       └─ lib/validate.mjs  deterministic deck validation
```

The plugin skills invoke the CLI through an absolute path derived from the installed skill location:

```bash
node "<plugin-root>/bin/codex-slides.mjs" init "Title" --format html
node "<plugin-root>/bin/codex-slides.mjs" check slides/title
```

## Formats

Templates remain local and editable:

- HTML: dependency-free presentation runtime
- Marp: Markdown deck plus custom theme
- PPTX: PptxGenJS source project

The root package has no runtime dependencies. A generated PPTX project owns its own PptxGenJS dependency.

## Validation

`npm run check` performs:

1. Node syntax checks.
2. Codex plugin and marketplace validation.
3. Skill metadata and portability checks.
4. Template smoke tests for HTML, Marp, and PPTX.
5. Example-deck validation.
6. Node test suite.
