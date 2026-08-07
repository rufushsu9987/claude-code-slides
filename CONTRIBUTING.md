# Contributing

Contributions are welcome for narrative workflows, layout patterns, accessibility, format validators, templates, portable packaging, host adapters, and examples.

## Development

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run sync:skills
npm run check
```

## Editing portable skills

The authoritative workflow files live under `skills/`.

Shared reference sources live under root `references/`. The reusable CLI wrapper source lives at `scripts/skill-cli-wrapper.mjs`.

After changing either source:

```bash
npm run sync:skills
npm run check:skills
```

Do not hand-edit generated copies under `skills/*/references/` or `skills/*/scripts/` without updating the canonical source.

Portable skills must:

- use only standard `name` and `description` frontmatter
- reference files with `references/...` and `scripts/...` paths from the skill root
- avoid Codex `$skill` syntax, Claude Code command namespaces, and host-specific environment variables
- keep all package paths within the plugin root

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
- Avoid official Anthropic or OpenAI marks, copied UI, or wording that suggests endorsement.
