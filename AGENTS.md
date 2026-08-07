# Repository instructions

This repository ships one portable presentation core plus native Codex and Claude Code adapters.

## Architecture

- `plugin.json`: Agent Plugins 1.0.0 portable manifest.
- `skills/`: authoritative portable Agent Skills.
- `references/`: canonical shared reference content.
- `scripts/sync-skill-resources.mjs`: copies canonical references and the CLI wrapper into skill-local `references/` and `scripts/`.
- `.codex-plugin/`, `.agents/plugins/`, `.agents/skills/`: Codex adapter.
- `.claude-plugin/`, `agents/`, `CLAUDE.md`: Claude Code adapter.
- `bin/` and `lib/`: zero-dependency presentation CLI.

## Public surface

Portable skills:

- `create-deck`
- `review-deck`
- `speaker-notes`
- `claude-code-style`
- `deck-architect`
- `visual-director`
- `deck-reviewer`

Codex invokes them as `$skill-name`. Claude Code exposes namespaced skills and three native subagents.

## Rules

- Keep root `plugin.json` conformant to `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`.
- Keep portable `SKILL.md` files free of host-specific runtime variables, command namespaces, and plugin-root placeholders.
- Reference bundled files with `references/...` and `scripts/...` paths relative to the skill root.
- Edit canonical content under root `references/` or `scripts/skill-cli-wrapper.mjs`, then run `npm run sync:skills`.
- Do not edit generated skill-local copies without updating their canonical source.
- Keep all manifests and package versions synchronized.
- Preserve HTML, Marp, and editable PPTX output.
- Do not add root runtime dependencies unless Node-native capabilities are insufficient.
- Never imply official Anthropic or OpenAI affiliation.

## Validation

```bash
npm ci
npm run sync:skills
npm run check
```
