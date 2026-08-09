# Contributing

Contributions are welcome for narrative workflows, layout patterns, accessibility, format validators, templates, portable packaging, host adapters, and examples.

## Development

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run sync:skills
npm run sync:metadata
npm run check
```

## Editing portable skills

The authoritative workflow files live under `skills/`.

Shared reference sources live under root `references/`. `references/python-svg-plan.md` is the canonical visual-plan template; `templates/python-svg-plan.md` remains a compatibility copy. The reusable SVG helper and CLI wrapper sources live at `scripts/generate-slide-art.py` and `scripts/skill-cli-wrapper.mjs`. CLI runtime bundles are generated from `bin/slides.mjs`, `lib/`, and `templates/`.

After changing either source:

```bash
npm run sync:skills
npm run check:skills
```

Do not hand-edit generated copies under `skills/*/references/`, `skills/*/scripts/`, `skills/*/runtime/`, or `.agents/skills/` without updating the canonical source.

Portable skills must:

- use only standard `name` and `description` frontmatter
- reference files with `references/...` and `scripts/...` paths from the skill root
- avoid Codex `$skill` syntax, Claude Code command namespaces, and host-specific environment variables
- keep all package paths within the installed skill root

## Host testing

Codex:

```bash
codex plugin marketplace add .
codex plugin add claude-code-slides@rufus-slides
codex
```

Claude Code:

```bash
claude plugin validate .
claude --plugin-dir .
```

## Pull requests

- Keep each pull request focused.
- Add or update tests for portable manifests, skills, host adapters, CLI behavior, or validators.
- Keep HTML templates dependency-free.
- Keep generated PPTX dependencies inside the generated deck.
- Update `CHANGELOG.md` for user-visible changes.
- Run `npm run sync:metadata` after changing package, plugin, or marketplace release metadata.
- Keep `CHANGELOG.md` Unreleased entries until cutting a new version; tag releases require an empty Unreleased section and a dated version heading.
- Avoid official Anthropic or OpenAI marks, copied UI, or wording that suggests endorsement.
