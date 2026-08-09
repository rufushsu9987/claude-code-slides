# Architecture

Claude Code Slides ships one portable Agent Plugins core, two native host adapters, and a dependency-free Node.js presentation CLI. The portable manifest does not use client-extension pointers: Codex and Claude Code discover their own sidecar manifests through their native packaging conventions.

## Surfaces

```text
portable core
├─ plugin.json
├─ skills/*/SKILL.md
├─ references/                    canonical guidance
└─ bin/ + lib/ + templates/       presentation runtime

native adapters
├─ Codex:       .codex-plugin/ + .agents/plugins/ + .agents/skills/
└─ Claude Code: .claude-plugin/ + agents/ + CLAUDE.md
```

Compatible Agent Plugins clients consume `plugin.json` and `skills/`. Codex and Claude Code use the same authoritative workflow files through their native adapters. Codex can select a skill from its description or through `$skill-name`; Claude Code exposes namespaced skills and native presentation subagents.

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

Each portable skill resolves bundled resources from its own `SKILL.md` location. Skills that call the presentation CLI carry a synchronized local runtime, so a skill directory remains executable when installed without the repository root. No host environment variable or globally installed command is required.

## CLI

`bin/slides.mjs`, `bin/codex-slides.mjs`, and `bin/claude-slides.mjs` call the same library. The first is the neutral portable entry point; the other two are host-facing aliases.

```text
bin/*
  └─ lib/cli.mjs
       ├─ lib/runtime.mjs   template scaffolding and diagnostics
       └─ lib/validate.mjs  deterministic deck validation
```

CLI-using skills invoke their bundled neutral runtime through a small wrapper. They derive an absolute path from the installed skill directory while preserving the user's working directory:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" init "Title" --format html
node "<absolute-skill-dir>/scripts/slides-cli.mjs" check slides/title
```

`npm run sync:skills` copies canonical references, the SVG helper, the wrapper, and the required runtime files into their managed skill destinations. `npm run check:skills` compares the exact managed file sets and detects drift or orphaned generated files.

## Formats

Templates remain local and editable:

- HTML: dependency-free presentation runtime
- Marp: Markdown deck plus custom theme
- PPTX: PptxGenJS source project

The root package has no runtime dependencies. A generated PPTX project owns its own PptxGenJS dependency.

## Validation

`npm run check` performs:

1. Node syntax checks.
2. Portable and native plugin/marketplace validation.
3. Skill metadata and portability checks.
4. Release metadata synchronization checks.
5. Template smoke tests for HTML, Marp, and PPTX.
6. Example-deck validation.
7. Node test suite, including isolated-skill execution tests.

Tag-triggered releases repeat the full Node 18/22/24 matrix, verify tag and changelog freshness, build a checksum, extract the archive, and rerun the complete checks from the extracted artifact before publishing.
