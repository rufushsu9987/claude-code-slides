---
name: review-deck
description: Review and improve an existing HTML, Marp, PptxGenJS, Slidev, Reveal.js, React, or PowerPoint presentation. Use to critique, polish, simplify, validate, fix layout repetition, improve storytelling, check accessibility, or prepare a deck for delivery.
---

# Review and improve a presentation deck

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

Keep the user's project or workspace as the shell working directory. Resolve each helper from the directory containing this `SKILL.md`, convert it to an absolute path, and do not `cd` into the installed skill directory. In commands below, replace `<absolute-skill-dir>` with that real directory; never type the placeholder literally.

## Workflow

1. Detect the format and locate source files, generated output, notes, `deck-plan.md`, local assets, and any `.visual.md` / `.py` / `.svg` visual source sets.
2. Read the brand-neutral references. Load the Claude Code-inspired visual system only when metadata selects `claude-editorial` / `terminal-editorial`, or the user explicitly requests that style.
3. Run:

   ```bash
   node "<absolute-skill-dir>/scripts/slides-cli.mjs" check <deck-path> --json
   ```

4. Use the sibling `deck-reviewer` skill as an independent review pass when available.
5. Compare the implementation with `deck-plan.md`. If a non-trivial deck has no plan, reconstruct a compact one before making structural changes.
6. Inspect every page and synthesize findings without repeating automated warnings.
7. Audit the cover separately.
8. Audit semantic layout fit and the complete layout sequence.
9. Apply authorized, high-confidence fixes while preserving the user's brand and source of truth.
10. Update `deck-plan.md` whenever a fix changes thesis, evidence, page role, information shape, visual form, section order, or decision.
11. Re-run validation and preview or generate the deliverable when possible.

## Review dimensions

### Plan fidelity and narrative

- Are audience, desired outcome, thesis, and Direction Lock clear?
- Does the deck's page order match the intended story spine?
- Does each page have one unique role, claim, and internal audience takeaway?
- Does every page advance the argument and create a reason for the next?
- Are same-section transitions logical, with evidence close to the claim it supports?
- Does the sequence jump from symptom to solution without root cause or mechanism?
- Is the strongest point early enough?
- Does the close request a specific action rather than merely recap?
- Are visible takeaway callouts omitted when they merely repeat the title?

### Content integrity

- Do headlines state defensible conclusions?
- Are facts, numbers, quotations, images, and system components sourced?
- Are Verified, Derived, Assumption, and Proposal claims separated?
- Are dates, units, definitions, and comparison contexts visible where needed?
- Are risks and tradeoffs represented honestly?
- Are terminology and tense consistent?
- Is visible text appropriate for live delivery?
- Is nuance moved into speaker notes rather than compressed into small type?

### Semantic layout fit

- Is each page's information shape explicit?
- Does the visual form explain that shape faster than bullets or generic cards?
- Does the selected layout archetype support the page's evidence-to-claim relationship?
- Are protocol interactions shown with actors, message order, and labeled request/response arrows?
- Are cross-team handoffs shown with owners, triggers, approvals, and failure paths?
- Are causal chains, timelines, hierarchies, boundaries, loops, and decisions represented according to their actual semantics?
- Are screenshots annotated with what they prove?
- Is code paired with a visible result?
- Are aligned records implemented as a native table rather than a text-box grid?
- Would a screenshot, verified chart, native editable shapes, or whitespace communicate more honestly?

### Layout sequence and visual design

- Does a 10+ slide deck use at least eight distinct archetypes when appropriate?
- Are exact consecutive archetype repeats eliminated?
- Does the same visual family dominate more than two of any three consecutive pages?
- Are card-grid and node-card pages limited to roughly 20%?
- Are generic split-screen pages limited to roughly 35%?
- Is the same underlying geometry repeated for no more than two consecutive pages?
- Is there a visible rhythm change every three to four pages?
- Is hierarchy obvious within two seconds?
- Is there one dominant element per page?
- Do layout changes follow meaning rather than random variety?
- Does the deck read clearly at thumbnail scale?
- Are alignment, spacing, typography, and color consistent?
- Are diagrams simpler than the prose they replace?

### Cover

- Are title and audience promise dominant?
- Does the right half carry exactly one meaningful artifact, proof, signal, or direct system cue—or remain empty when none exists?
- Are generic orbit, hub-and-spoke, concentric-circle, logo-cloud, and micro-label diagrams removed unless they directly prove the thesis?
- Is any decorative or meaningless cover visual replaced with evidence or whitespace?
- Does every proof-rail signal have a role, source, date, and explicit relationship to the others?
- When the opening is causal or mechanism-led, does the next page explain the mechanism rather than expanding the cover into a dashboard?
- Is the proof-to-mechanism handoff clear?

### Custom Python SVG and diagrams

- Does every custom SVG have a current `.visual.md`, `.py`, and `.svg` source set?
- Does the plan define source of truth, semantic model, geometry, eye path, accessibility, editable outside content, and validation?
- Does the generated SVG agree with the plan and source facts?
- Can it be regenerated deterministically and parsed as XML?
- Are labels readable at presentation and thumbnail scale?
- Was Python SVG chosen for a real communication advantage?
- When a diagram is a standalone architecture, flowchart, sequence, state, ER, timeline, swimlane, quadrant, loop, chart, data-flow, or security visual, was `diagram-design` used or its type-specific grammar and self-check applied?

### Technical quality

- HTML: navigation, hash state, responsive scaling, printing, accessibility, asset paths, layout markers, and console errors.
- Marp: frontmatter, theme, separators, layout classes, overflow risk, assets, and exportability.
- PPTX: wide layout, generation, explicit layout and geometry sequences, native tables, safe APIs, font portability, editability, notes, and text bounds.
- Other frameworks: preserve the component model and build workflow; verify the real production command.

### Delivery readiness

- Speaker notes contain nuance, caveats, and transitions that should not crowd the canvas.
- Type, diagrams, tables, and code remain legible at projected distance.
- No unresolved tokens, TODOs, lorem ipsum, broken links, or missing assets remain.
- README contains preview and export commands.
- Demo fallbacks exist for network, authentication, or live-service risk.

## Applying fixes

Preserve plan and source truth. Fit, spacing, alignment, accessibility, and equivalent-medium fixes may be applied directly. Update `deck-plan.md` before changing a claim, evidence interpretation, slide role, order, information shape, visual form, or decision.

Do not redesign an entire deck merely because one page is weak. Prefer the smallest coherent fix, then re-run deterministic checks and inspect the affected pages in context.

## Severity

- **Critical**: broken output, missing content or assets, unreadable page, false claim, security or confidentiality issue.
- **Major**: plan drift, narrative gap, severe density, semantic-layout mismatch, repetitive layout sequence, decorative or meaningless cover visual, accessibility failure, likely overflow, unreliable demo.
- **Minor**: polish issue that does not block delivery.
- **Suggestion**: optional enhancement with a clear audience benefit.

Lead with the three highest-impact changes, then give concise page-specific findings. Do not overwhelm the user with low-value pixel commentary.
