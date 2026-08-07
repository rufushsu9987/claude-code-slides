# Repository instructions

This repository is a dual-platform presentation plugin for Codex and Claude Code plus a zero-dependency Node.js CLI. The product name describes the bundled visual direction; it is not an official Anthropic or OpenAI integration.

Work in focused, reviewable changes. Run `npm test` and `npm run check` before committing.

## Public surface

Shared skills:

- `create-deck`
- `review-deck`
- `speaker-notes`
- `claude-code-style`
- `deck-architect`
- `visual-director`
- `deck-reviewer`

Codex invocation:

- `$create-deck`, `$review-deck`, `$speaker-notes`
- repository discovery through `.agents/skills/`
- install metadata in `.codex-plugin/plugin.json`
- marketplace in `.agents/plugins/marketplace.json`

Claude Code invocation:

- `/claude-code-slides:create-deck`
- `/claude-code-slides:review-deck`
- `/claude-code-slides:speaker-notes`
- subagents in `agents/`
- install metadata and marketplace in `.claude-plugin/`

Local CLI:

- `codex-slides init|check|doctor`
- `claude-slides init|check|doctor`

## Rules

- Keep the root `skills/` directory platform-neutral; both hosts consume the same workflow source.
- Keep Codex forwarders under `.agents/skills/`.
- Keep Claude Code subagents under `agents/`.
- Keep all four manifests valid and versions synchronized with `package.json`, `package-lock.json`, and `lib/runtime.mjs`.
- Do not add a root runtime dependency unless Node-native capabilities cannot solve the problem.
- Generated PPTX decks may declare PptxGenJS inside their own output directory.
- Keep generated decks portable, local-first, accessible, and easy to archive.
- A supplied corporate brand or existing slide framework takes precedence over the bundled style.
- Never imply that this repository is maintained, endorsed, or affiliated with Anthropic or OpenAI.
