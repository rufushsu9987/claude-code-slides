# Repository instructions

This repository ships one portable presentation core plus native Codex and Claude Code adapters.

## Architecture

- `plugin.json`: Agent Plugins 1.0.0 portable manifest.
- `skills/`: authoritative portable Agent Skills, including the vendored `diagram-design` visual diagram skill.
- `references/`: canonical storytelling, visual, layout, output, review, and Python SVG planning guidance.
- `templates/catalog.json`: visual-theme catalog; default is `claude-editorial`.
- `templates/layouts.json`: authoritative semantic layout archetypes and diversity rules.
- `scripts/generate-slide-art.py` and `scripts/skill-cli-wrapper.mjs`: canonical skill-local helper sources.
- `scripts/sync-skill-resources.mjs`: generates skill-local references, helpers, CLI runtime bundles, and `.agents/skills/` forwarders.
- `scripts/sync-release-metadata.mjs`: keeps package, plugin, and marketplace descriptions and versions aligned.
- `.codex-plugin/`, `.agents/plugins/`, `.agents/skills/`: Codex adapter.
- `.claude-plugin/`, `agents/`, `CLAUDE.md`: Claude Code adapter.
- `bin/` and `lib/`: zero-dependency presentation CLI.

## Public surface

Portable skills: `create-deck`, `review-deck`, `speaker-notes`, `claude-code-style`, `deck-architect`, `visual-director`, `deck-reviewer`, and `diagram-design`.

Codex invokes them as `$skill-name`. Claude Code exposes namespaced skills and three native subagents. CLI commands include `templates`, `layouts`, `init`, `check`, and `doctor`.

## Rules

- Keep root `plugin.json` conformant to `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`.
- Keep portable `SKILL.md` files free of host-specific runtime variables, command namespaces, and plugin-root placeholders.
- Reference bundled files with `references/...` and `scripts/...` paths relative to the skill root.
- Edit canonical content under root `skills/`, `references/`, `scripts/generate-slide-art.py`, `scripts/skill-cli-wrapper.mjs`, `bin/`, `lib/`, or `templates/`, then run `npm run sync:skills`.
- `skills/diagram-design/` is a vendored, self-contained skill pack; edit it in place, preserve its attribution and licenses, and do not treat its gallery assets as generated presentation-core copies.
- Do not edit generated skill-local copies without updating their canonical source.
- Treat `package.json` as the release-version source and run `npm run sync:metadata` after changing synchronized descriptions or versions.
- Keep `claude-editorial` as the canonical default and preserve documented aliases.
- Select layout archetypes by semantic page role, not random visual variation.
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
