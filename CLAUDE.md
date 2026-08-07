# Repository guide

This repository is a Claude Code plugin, marketplace, and zero-dependency project CLI.

## Product surface

- `/claude-code-slides:create-deck`
- `/claude-code-slides:review-deck`
- `/claude-code-slides:speaker-notes`
- background skill: `claude-code-style`
- subagents: `deck-architect`, `visual-director`, `deck-reviewer`
- CLI: `claude-slides`

## Rules

- Keep plugin components at the repository root. Only manifests belong in `.claude-plugin/`.
- Keep the root CLI dependency-free and compatible with Node.js 18+.
- Preserve all three bundled formats: HTML, Marp, and PptxGenJS.
- Treat presentation work as communication design, not document formatting.
- Preserve accessibility: semantic headings, keyboard navigation, readable contrast, reduced motion, and useful alt text.
- Do not invent facts, sources, logos, benchmarks, screenshots, or customer names.
- Never imply that this project is maintained, endorsed, or affiliated with Anthropic.
- Bump the version in `package.json`, both manifests, `lib/cli.mjs`, and `CHANGELOG.md` for releases.

## Validation

```bash
npm test
npm run check
claude plugin validate .
```
