# Repository instructions

This repository ships one portable presentation core plus native Codex and Claude Code adapters.

## Architecture

- `plugin.json`: Agent Plugins 1.0.0 portable manifest.
- `skills/`: authoritative portable Agent Skills.
- `references/`: canonical storytelling, visual, layout, output, and review guidance.
- `templates/catalog.json`: visual-theme catalog; default is `claude-editorial`.
- `templates/layouts.json`: 16 semantic layout archetypes and diversity rules.
- `scripts/sync-skill-resources.mjs`: copies canonical references, the CLI wrapper, and promotion-pipeline scripts into skill-local resources.
- `.codex-plugin/`, `.agents/plugins/`, `.agents/skills/`: Codex adapter.
- `.claude-plugin/`, `agents/`, `CLAUDE.md`: Claude Code adapter.
- `bin/` and `lib/`: zero-dependency presentation and promotion CLI.

## Public surface

Portable skills:

- `create-deck`
- `review-deck`
- `speaker-notes`
- `claude-code-style`
- `deck-architect`
- `visual-director`
- `deck-reviewer`
- `repo-intake`
- `narration-producer`
- `html-video-renderer`
- `media-qa`
- `release-packager`
- `promo-video` (the single top-level orchestrator)

Codex invokes them as `$skill-name`. Claude Code exposes namespaced skills and four native subagents; `promo-video` is the only new orchestration subagent, while the six pipeline stages remain internal reusable scripts/Skills. The Memory Hub integration uses one persistent `Promo Pipeline Agent`, not six top-level Agents. CLI commands include `templates`, `layouts`, `init`, `check`, `doctor`, and `promo run`.

## Rules

- Keep root `plugin.json` conformant to `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`.
- Keep portable `SKILL.md` files free of host-specific runtime variables, command namespaces, and plugin-root placeholders.
- Reference bundled files with `references/...`, `scripts/...`, and `lib/...` paths relative to the skill root.
- Edit canonical content under root `references/`, `scripts/`, or `lib/promo.mjs`, then run `npm run sync:skills`.
- Do not edit generated skill-local copies without updating their canonical source.
- Keep `claude-editorial` as the canonical default and preserve documented aliases.
- Select layout archetypes by semantic page role, not random visual variation.
- Keep all manifests and package versions synchronized.
- Preserve HTML, Marp, and editable PPTX output.
- Do not add root runtime dependencies unless Node-native capabilities are insufficient.
- Never imply official Anthropic or OpenAI affiliation.
- The promotion pipeline must ground public claims in repository evidence, keep HTML as the visual source of truth for HTML-derived video, and never claim QA or publication without real artifacts and evidence.

## Validation

```bash
npm ci
npm run sync:skills
npm run check
```
