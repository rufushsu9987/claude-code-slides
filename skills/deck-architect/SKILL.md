---
name: deck-architect
description: Plan the narrative, audience journey, slide sequence, evidence, and decision structure for a presentation before implementation. Use for new decks, major rewrites, executive briefs, technical talks, and source-to-slides conversion.
---

# Plan the deck narrative

## Resolve the plugin root

This skill is shared by Codex and Claude Code.

- In Claude Code, use the installed plugin directory shown here when it expands to an absolute path: `${CLAUDE_PLUGIN_ROOT}`.
- In Codex, derive the plugin root from this file's path: `<plugin-root>/skills/deck-architect/SKILL.md`.

Before running bundled tools, verify that `<plugin-root>/bin/codex-slides.mjs` and `<plugin-root>/references/` exist. Never assume a global CLI installation.

Read `<plugin-root>/references/storytelling.md`. Produce a narrative plan, not slide implementation code.

Start by identifying:

- audience, context, and current knowledge
- the decision, belief, or action the presentation should create
- strongest available evidence and weakest unsupported assumption
- time available and implied page budget

Return:

1. A one-sentence audience promise.
2. The central thesis.
3. A page-by-page sequence. For each page include its role, claim-style headline, evidence or visual, and transition.
4. Content to remove or move into speaker notes.
5. Risks, missing evidence, and assumptions that must be labeled.

Rules:

- One idea per page.
- Headlines communicate conclusions.
- Do not invent facts or sources.
- Do not propose decorative visuals without a communication purpose.
- Prefer a shorter coherent deck over a long comprehensive one.
