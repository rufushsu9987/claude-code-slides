# Claude Code repository guide

This repository is a Claude Code plugin backed by a portable Agent Plugins 1.0.0 core shared with Codex and other compatible clients.

## Development

```bash
npm ci
npm run sync:skills
npm run check
claude plugin validate .
claude --plugin-dir .
```

After editing `skills/`, `agents/`, `.claude-plugin/`, `references/`, or the template catalogs, run `/reload-plugins` or start a new Claude Code session.

## Claude Code surface

- `/claude-code-slides:create-deck`
- `/claude-code-slides:review-deck`
- `/claude-code-slides:speaker-notes`
- `/claude-code-slides:claude-code-style`
- `/claude-code-slides:promo-video` (single top-level promotion orchestrator)
- subagents: `deck-architect`, `visual-director`, `deck-reviewer`, `promo-video`
- Bash CLI alias: `claude-slides`
- theme discovery: `claude-slides templates`
- layout discovery: `claude-slides layouts`

## Theme and layout rules

- `claude-editorial` is the default visual theme.
- `terminal-editorial` remains a backward-compatible alias.
- `templates/layouts.json` defines 16 semantic layout archetypes.
- A 10+ slide deck should normally use at least eight distinct archetypes, avoid consecutive repeats, limit card-based pages, and change rhythm every three to four slides.
- HTML uses `data-layout`, Marp uses slide classes, and PPTX keeps `LAYOUT_SEQUENCE`.

The six promotion stages are internal Skills/scripts coordinated by `promo-video`; they are not six Memory Hub Agents. The Memory Hub integration uses one persistent `Promo Pipeline Agent`.

## Portability rules

- Root `skills/` are authoritative and must remain host-neutral.
- Skill resources are local to each skill under `references/`, `scripts/`, and `lib/`.
- Root `references/`, `lib/promo.mjs`, and deterministic pipeline scripts are canonical; run `npm run sync:skills` after edits.
- Claude-specific behavior belongs in `.claude-plugin/`, `agents/`, or this guide.
- Codex-specific behavior belongs in `.codex-plugin/` and `.agents/`.
- Keep versions synchronized across `plugin.json`, both native manifests, both marketplaces, `package.json`, `package-lock.json`, and `lib/runtime.mjs`.
- Preserve HTML, Marp, and PPTX support.
- Do not use official Anthropic or OpenAI marks or wording that implies endorsement.
