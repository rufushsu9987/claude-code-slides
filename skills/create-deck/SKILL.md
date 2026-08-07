---
name: create-deck
description: Create a polished presentation deck from a topic, brief, document, URL, or repository. Use for slides, presentations, pitch decks, technical talks, architecture reviews, status reports, training decks, or source-to-slides conversion. Supports HTML, Marp, PPTX, and existing slide frameworks.
---

# Create a presentation deck

Create the presentation requested in the current user message. Treat it as a deliverable: inspect the source material, create editable files, validate the result, and leave clear preview or export instructions.

## Resolve the plugin root

Use the absolute path of this `SKILL.md` as the anchor. The plugin root is two directories above it:

```text
<plugin-root>/skills/create-deck/SKILL.md
```

Read these references before implementation:

- `<plugin-root>/references/storytelling.md`
- `<plugin-root>/references/style-system.md`
- `<plugin-root>/references/output-formats.md`

Run the bundled CLI with:

```bash
node "<plugin-root>/bin/codex-slides.mjs" <command>
```

Never assume that `codex-slides` is globally installed.

## 1. Choose the delivery format

Honor an explicit format. Otherwise infer it from the intended use:

- **HTML**: default for live talks, design fidelity, interaction, offline playback, browser sharing, or unspecified output.
- **Marp**: Markdown review, Git diffs, documentation-style decks, or fast PDF generation.
- **PPTX**: editable Microsoft PowerPoint, corporate handoff, or Office compatibility.
- **Existing framework**: when the repository already uses Slidev, Reveal.js, React, Marp, or a company template, preserve that workflow unless the user asks to migrate.

Do not ask the user to choose when the request already implies a sensible default. State the assumption briefly and proceed.

## 2. Inspect the source material

- Read every local file, URL, document, image, or code path the request depends on.
- For repository-based technical decks, identify the actual architecture, dependencies, data flows, trust boundaries, deployment model, operations, costs, and risks. Do not invent them.
- Preserve attribution for external facts, charts, screenshots, quotations, and benchmarks.
- Label uncertain claims as assumptions.
- Never copy confidential material into a deck unless the user clearly intends that audience to receive it.

## 3. Lock the communication objective

Infer or establish:

- audience and current knowledge
- the decision, belief, or action the deck should create
- duration and page budget
- one-sentence audience promise
- central thesis
- strongest evidence and weakest assumption

Ask only for a missing constraint that materially changes the output. Otherwise make a reasonable assumption and continue.

## 4. Plan before implementation

For non-trivial decks, use the `$deck-architect` and `$visual-director` skills as focused planning passes when they are available. If Codex cannot load them, perform the same roles inline.

Synthesize one concise outline. Every page must have one job and one memorable takeaway. A useful default sequence is cover → context → tension → thesis → evidence → execution → risks → decision. Adapt it rather than forcing it.

## 5. Scaffold the output

For a new deck, run one of:

```bash
node "<plugin-root>/bin/codex-slides.mjs" init "Deck title" --format html
node "<plugin-root>/bin/codex-slides.mjs" init "Deck title" --format marp
node "<plugin-root>/bin/codex-slides.mjs" init "Deck title" --format pptx
```

The default destination is `slides/<slug>/`. Respect an explicit path or existing repository convention.

| Format | Minimum deliverable |
| --- | --- |
| HTML | `index.html`, `theme.css`, `slides.js`, `README.md` |
| Marp | `deck.md`, `theme.css`, `README.md` |
| PPTX | `deck.mjs`, `package.json`, `README.md`; generate the `.pptx` when installation is permitted |

Keep assets inside the deck directory.

## 6. Author the deck

Apply the bundled warm terminal-editorial system unless the user supplies a brand or requests another direction.

Content rules:

- One idea per page.
- Use claim-style headlines, not labels such as “Overview” or “Architecture”.
- Prefer diagrams, numbers, timelines, comparisons, short code, screenshots, and quotations over bullet walls.
- Keep most pages below roughly 35 visible words. Dense reference pages are an explicit exception.
- Put nuance, caveats, transitions, and secondary evidence in speaker notes.
- Use useful alt text and text equivalents for meaningful visuals.
- Never fabricate logos, customer names, benchmarks, citations, product screenshots, or research findings.
- Do not use private or copyrighted assets without clear authorization and attribution.

Technical-deck rules:

- Show system, trust, data-ownership, and operational boundaries.
- Label protocols, identities, stores, control plane, data plane, and failure paths.
- Separate current state, target state, and migration plan.
- Cover security, operability, cost, performance, maintainability, and tradeoffs when relevant.
- Keep code samples short and projection-safe.

## 7. Validate and improve

Run:

```bash
node "<plugin-root>/bin/codex-slides.mjs" check <deck-path>
```

Then use `$deck-reviewer` for an independent review when available. Fix high-confidence Critical and Major findings and re-run validation.

Also verify the format-specific output:

- HTML: keyboard, click and swipe navigation; hash state; viewport scaling; notes; reduced motion; print-to-PDF; local assets.
- Marp: frontmatter; separators; theme loading; asset paths; HTML/PDF export.
- PPTX: generation succeeds; wide layout; editable elements; speaker notes; text bounds; portable fonts; deterministic filename.

## 8. Hand off

Report:

- deck path and format
- slide count
- preview or export command
- unresolved assumptions, missing assets, or validation limitations

Do not bury the deliverable under a long process summary.
