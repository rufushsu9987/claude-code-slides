# Repository instructions

This repository is a Codex plugin and a zero-dependency presentation CLI. The product name describes the bundled visual direction; it is not an Anthropic integration.

Work in focused, reviewable changes. Run `npm test` and `npm run check` before committing.

## Public surface

Codex skills:

- `$create-deck`
- `$review-deck`
- `$speaker-notes`
- `$claude-code-style`
- `$deck-architect`
- `$visual-director`
- `$deck-reviewer`

Local CLI:

- `codex-slides init|check|doctor`
- `claude-slides` remains a compatibility alias

## Rules

- Keep `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json` valid.
- Keep repo-scoped skill forwarders under `.agents/skills/`.
- Do not add a root runtime dependency unless Node-native capabilities cannot solve the problem.
- Generated PPTX decks may declare PptxGenJS inside their own output directory.
- Keep generated decks portable, local-first, accessible, and easy to archive.
- A supplied corporate brand or existing slide framework takes precedence over the bundled style.
- Never imply that this repository is maintained, endorsed, or affiliated with Anthropic or OpenAI.
