---
name: review-deck
description: Review and improve an existing HTML, Marp, PptxGenJS, Slidev, Reveal.js, React, or PowerPoint presentation. Use to critique, polish, simplify, validate, fix layout repetition, improve storytelling, check accessibility, or prepare a deck for delivery.
---

# Review a presentation deck

Review the deck identified by the current user request. When the user asks for fixes, implement high-confidence improvements after diagnosis.

## Bundled resources

Resolve these paths relative to this skill directory:

- [Review checklist](references/review-checklist.md)
- [Brand-neutral visual quality](references/visual-quality.md) — read for every deck
- [Claude Code-inspired visual system](references/style-system.md) — read only when the deck selects `claude-editorial` / `terminal-editorial`, or the user explicitly requests Claude styling
- [Layout system](references/layout-system.md)
- [Python SVG authoring protocol](references/python-svg-authoring.md)
- [Python SVG plan template](references/python-svg-plan.md)
- [Output format guidance](references/output-formats.md)
- `scripts/slides-cli.mjs` — portable wrapper for deterministic validation
- `scripts/generate-slide-art.py` — optional pattern library and fallback renderer
- `diagram-design` skill — when available, for auditing or improving architecture, flowchart, sequence, data, and security diagrams

Keep the user's project or workspace as the shell working directory. Resolve each helper from the directory containing this `SKILL.md`, convert it to an absolute path, and do not `cd` into the installed skill before running it. In commands below, replace `<absolute-skill-dir>` with that real absolute directory; never type the placeholder literally.

## Workflow

1. Detect the format and locate source files, generated output, notes, local assets, and any `.visual.md` / `.py` / `.svg` visual source sets.
2. Read the brand-neutral references. Load the Claude Code-inspired visual system only when the deck metadata selects `claude-editorial` / `terminal-editorial`, or the user explicitly requests that style.
3. Run:

   ```bash
   node "<absolute-skill-dir>/scripts/slides-cli.mjs" check <deck-path> --json
   ```

4. Use the sibling `deck-reviewer` skill as an independent review pass when available.
5. Inspect every page and synthesize findings without repeating automated warnings.
6. Audit the cover separately: title and promise dominance, whether the right half has a clear information job, source quality, two-second comprehension, and thumbnail readability.
7. Audit the layout sequence: unique archetypes, consecutive repeats, visual-family repetition, card share, and rhythm changes.
8. Apply authorized, high-confidence fixes while preserving the user's brand and source of truth.
9. Re-run validation and preview or generate the deliverable when possible.

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

### Layout and visual design

- Does every page's layout match its communication role?
- Does a 10+ slide deck use at least eight distinct archetypes when appropriate?
- Are exact consecutive repeats eliminated?
- Does the same visual family dominate more than two of any three consecutive pages?
- Are card-grid and node-card pages limited to roughly 20%?
- Is there a visible rhythm change every three to four pages?
- Is hierarchy obvious within two seconds?
- Is there one dominant element per page?
- Does the cover's right half carry one meaningful artifact, proof, signal, or direct system cue—or remain empty when none exists?
- Are generic orbit, hub-and-spoke, concentric-circle, logo-cloud, and micro-label cover diagrams removed unless they directly prove the thesis?
- Does every proof-rail number have a semantic role, source, date, and an explicit relationship to the other signals?
- When the opening is mechanism-led, does the next page explain the causal model instead of expanding the cover rail into a dense dashboard?
- Does every custom SVG have a current `.visual.md` plan and deck-local Python source, or a documented reason for using a shared built-in renderer?
- Does the plan describe the source of truth and semantic model before shapes, and does the SVG actually follow that plan?
- Would a screenshot, verified chart, native editable shapes, or whitespace communicate the page more honestly or efficiently?
- Can the custom SVG be regenerated deterministically, parsed as XML, and read at presentation and thumbnail distance?
- Are alignment, spacing, typography, and color consistent?
- Are diagrams simpler than the prose they replace?
- When a diagram is a standalone architecture, flowchart, sequence, state, ER, timeline, swimlane, quadrant, loop, chart, data-flow, or security visual, was the `diagram-design` skill used or its type-specific grammar and self-check applied?

### Technical quality

- HTML: navigation, hash state, responsive scaling, printing, accessibility, asset paths, layout markers, and console errors.
- Marp: frontmatter, theme, separators, layout classes, overflow risk, assets, and exportability.
- PPTX: wide layout, output generation, explicit layout sequence, safe APIs, font portability, editability, notes, and text bounds.
- Other frameworks: preserve their component model and build workflow; verify the actual production command.

### Delivery readiness

- Speaker notes where nuance or transitions are required.
- Legible type, diagrams, and code at projected distance.
- No unresolved tokens, TODOs, lorem ipsum, broken links, or missing assets.
- A clear README with preview and export commands.
- Demo fallbacks for network, authentication, or live-service risk.

## Severity

- **Critical**: broken output, missing content or assets, unreadable page, false claim, security or confidentiality issue.
- **Major**: narrative gap, severe density, repetitive layout sequence, decorative or meaningless cover visual, accessibility failure, likely overflow, unreliable demo.
- **Minor**: polish issue that does not block delivery.
- **Suggestion**: optional enhancement with a clear audience benefit.

Lead with the three highest-impact changes, then give concise page-specific findings. Do not overwhelm the user with low-value pixel commentary.
