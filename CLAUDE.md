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
- subagents: `deck-architect`, `visual-director`, `deck-reviewer`
- Bash CLI alias: `claude-slides`
- theme discovery: `claude-slides templates`
- layout discovery: `claude-slides layouts`

## Theme and layout rules

- `claude-editorial` is the default visual theme.
- `terminal-editorial` remains a backward-compatible alias.
- `templates/layouts.json` is the authoritative source for semantic layout archetypes and diversity rules.
- A 10+ slide deck should normally use at least eight distinct archetypes, avoid consecutive repeats, limit card-based pages, and change rhythm every three to four slides.
- HTML uses `data-layout`, Marp uses slide classes, and PPTX keeps `LAYOUT_SEQUENCE`.

## Portability rules

- Root `skills/` are authoritative and must remain host-neutral.
- Skill resources are local to each skill under `references/`, `scripts/`, and (for CLI-using skills) `runtime/`.
- Root `skills/`, `references/`, `scripts/generate-slide-art.py`, `scripts/skill-cli-wrapper.mjs`, `bin/`, `lib/`, and `templates/` are canonical; run `npm run sync:skills` after edits.
- `.agents/skills/` forwarders and skill-local resources are generated; do not edit them without changing their canonical source.
- Claude-specific behavior belongs in `.claude-plugin/`, `agents/`, or this guide.
- Codex-specific behavior belongs in `.codex-plugin/` and `.agents/`.
- Keep `package.json` as the version source, then run `npm run sync:metadata` to update `plugin.json`, both native manifests, both marketplaces, `package-lock.json`, and `lib/runtime.mjs`.
- Preserve HTML, Marp, and PPTX support.
- Do not use official Anthropic or OpenAI marks or wording that implies endorsement.
