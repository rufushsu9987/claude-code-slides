# Claude Code repository guide

This repository ships one shared presentation workflow to both Claude Code and Codex.

## Development commands

```bash
npm ci
npm run check
claude --plugin-dir .
```

After editing `skills/`, `agents/`, or `.claude-plugin/`, run `/reload-plugins` in Claude Code or start a new session.

## Claude Code plugin surface

- `/claude-code-slides:create-deck`
- `/claude-code-slides:review-deck`
- `/claude-code-slides:speaker-notes`
- `/claude-code-slides:claude-code-style`
- subagents: `deck-architect`, `visual-director`, `deck-reviewer`
- CLI alias on Bash `PATH`: `claude-slides`

## Compatibility rules

- The authoritative workflows live in root `skills/`; do not create a separate Claude-only copy.
- Claude Code metadata lives in `.claude-plugin/` and `agents/`.
- Codex metadata lives in `.codex-plugin/`, `.agents/plugins/`, and `.agents/skills/`.
- Keep versions synchronized across both platforms.
- Preserve HTML, Marp, and PPTX output support.
- Do not use official Anthropic or OpenAI logos, copied product UI, or wording that implies endorsement.
