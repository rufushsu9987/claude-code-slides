# Contributing

Contributions are welcome for narrative workflows, layout patterns, accessibility, format validators, templates, and examples.

## Development

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm test
npm run check
claude --plugin-dir .
```

Inside Claude Code, run `/reload-plugins` after changing skills, agents, or manifests.

## Pull requests

- Keep each pull request focused.
- Add or update tests for CLI and validator behavior.
- Keep HTML templates dependency-free.
- Keep generated PPTX dependencies inside the generated deck, not the plugin root.
- Update `CHANGELOG.md` for user-visible changes.
- Avoid official Anthropic marks, copied UI, or wording that suggests endorsement.
