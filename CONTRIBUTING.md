# Contributing

Contributions are welcome for narrative workflows, layout patterns, accessibility, format validators, templates, platform integrations, and examples.

## Development

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run check
```

Test Codex repository discovery:

```bash
codex
# inspect /skills
```

Test the installable Codex plugin:

```bash
codex plugin marketplace add .
codex plugin add claude-code-slides@rufus-slides
```

Test Claude Code:

```bash
claude plugin validate .
claude --plugin-dir .
```

Inside Claude Code, run `/reload-plugins` after changing skills, agents, or manifests.

## Pull requests

- Keep each pull request focused.
- Add or update tests for CLI, manifest, marketplace, Skill, and agent behavior.
- Keep root `skills/` platform-neutral and avoid duplicating workflows per host.
- Keep HTML templates dependency-free.
- Keep generated PPTX dependencies inside the generated deck, not the plugin root.
- Update `CHANGELOG.md` for user-visible changes.
- Avoid official Anthropic or OpenAI marks, copied UI, or wording that suggests endorsement.
