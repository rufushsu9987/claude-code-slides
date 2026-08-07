# Contributing

Contributions are welcome for narrative workflows, layout patterns, accessibility, format validators, templates, and examples.

## Development

```bash
git clone https://github.com/rufushsu9987/claude-code-slides.git
cd claude-code-slides
npm ci
npm run check
codex
```

Codex discovers the repository skills through `.agents/skills/`. Restart Codex if a newly added skill does not appear.

To test the installable plugin:

```bash
codex plugin marketplace add .
```

Then open Codex, run `/plugins`, install **Claude Code Slides**, and start a new session.

## Pull requests

- Keep each pull request focused.
- Add or update tests for CLI, manifest, and skill behavior.
- Keep HTML templates dependency-free.
- Keep generated PPTX dependencies inside the generated deck, not the plugin root.
- Update `CHANGELOG.md` for user-visible changes.
- Avoid official Anthropic or OpenAI marks, copied UI, or wording that suggests endorsement.
