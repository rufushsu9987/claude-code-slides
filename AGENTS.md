# Agent instructions

Work in focused, reviewable changes. Run `npm test` and `npm run check` before committing.

The installed plugin experience is the public API:

- `/claude-code-slides:create-deck`
- `/claude-code-slides:review-deck`
- `/claude-code-slides:speaker-notes`
- `claude-code-style`
- `deck-architect`, `visual-director`, and `deck-reviewer`
- `claude-slides init|check|doctor`

Do not add a root runtime dependency unless browser-native or Node-native capabilities cannot solve the problem. Generated PPTX decks may declare PptxGenJS inside their own output directory.

Keep generated decks portable, local-first, accessible, and easy to archive. A supplied corporate brand or existing slide framework takes precedence over the bundled style.
