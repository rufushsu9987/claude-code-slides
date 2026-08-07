---
name: review-deck
description: Review and improve an existing HTML, Marp, PptxGenJS, Slidev, Reveal.js, React, or PowerPoint presentation. Use to critique, polish, simplify, validate, fix layout, improve storytelling, check accessibility, or prepare a deck for delivery.
---

# Review a presentation deck

Review the deck identified by the current user request. When the user asks for fixes, implement high-confidence improvements after diagnosis.

## Resolve the plugin root

Use this `SKILL.md` path as the anchor. The plugin root is two directories above it. Read:

- `<plugin-root>/references/review-checklist.md`
- `<plugin-root>/references/style-system.md`
- `<plugin-root>/references/output-formats.md`

Run deterministic checks with:

```bash
node "<plugin-root>/bin/codex-slides.mjs" check <deck-path> --json
```

Do not assume a globally installed CLI.

## Workflow

1. Detect the format and locate source files, generated output, notes, and local assets.
2. Read the three references above.
3. Run the bundled validator when the format is supported.
4. Use `$deck-reviewer` as an independent review pass when available.
5. Inspect every page and synthesize findings without repeating automated warnings.
6. Apply authorized, high-confidence fixes while preserving the user's brand and source of truth.
7. Re-run validation and preview or generate the deliverable when possible.

## Review dimensions

### Audience and narrative

- Is the audience, promise, and desired decision clear?
- Does each page advance the argument?
- Are transitions logical and is evidence close to the claim it supports?
- Is the strongest point early enough?
- Does the close request a specific action rather than merely recap?

### Content integrity

- Do headlines state conclusions?
- Is visible text appropriate for live delivery?
- Are facts, numbers, quotations, and images sourced?
- Are assumptions separated from verified facts?
- Are risks and tradeoffs represented honestly?
- Are terminology and tense consistent?

### Visual design

- Is hierarchy obvious within two seconds?
- Is there one dominant element per page?
- Are alignment, spacing, typography, and color consistent?
- Are diagrams simpler than the prose they replace?
- Are repeated cards, pills, borders, gradients, and terminal motifs restrained?

### Technical quality

- HTML: navigation, hash state, responsive scaling, printing, accessibility, asset paths, and console errors.
- Marp: frontmatter, theme, separators, overflow risk, assets, and exportability.
- PPTX: wide layout, output generation, safe APIs, font portability, editability, notes, and text bounds.
- Other frameworks: preserve their component model and build workflow; verify the actual production command.

### Delivery readiness

- Speaker notes where nuance or transitions are required.
- Legible type, diagrams, and code at projected distance.
- No unresolved tokens, TODOs, lorem ipsum, broken links, or missing assets.
- A clear README with preview and export commands.
- Demo fallbacks for network, authentication, or live-service risk.

## Severity

- **Critical**: broken output, missing content or assets, unreadable page, false claim, security or confidentiality issue.
- **Major**: narrative gap, severe density, inconsistent layout, accessibility failure, likely overflow, unreliable demo.
- **Minor**: polish issue that does not block delivery.
- **Suggestion**: optional enhancement with a clear audience benefit.

Lead with the three highest-impact changes, then give concise page-specific findings. Do not overwhelm the user with low-value pixel commentary.
