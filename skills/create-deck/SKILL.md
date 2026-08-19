---
name: create-deck
description: Create a polished presentation deck from a topic, brief, document, URL, or repository. Use for slides, presentations, pitch decks, technical talks, architecture reviews, status reports, training decks, or source-to-slides conversion. Supports HTML, Marp, PPTX, named professional templates, content-aware layout archetypes, and existing slide frameworks.
---

# Create a presentation deck

Create the presentation requested in the current user message. Treat it as a deliverable: inspect the source material, plan the argument, create editable files, validate the result, and leave clear preview or export instructions.

## Bundled resources

Resolve these paths relative to this skill directory:

- [Storytelling and slide-planning system](references/storytelling.md)
- [Brand-neutral visual quality](references/visual-quality.md) — read for every deck
- [Claude Code-inspired visual system](references/style-system.md) — read only after selecting `claude-editorial` / `terminal-editorial`, or when the user explicitly requests Claude styling
- [Layout system](references/layout-system.md)
- [Python SVG authoring protocol](references/python-svg-authoring.md)
- [Python SVG plan template](references/python-svg-plan.md)
- [Output format guidance](references/output-formats.md)
- `scripts/slides-cli.mjs` — portable wrapper for the bundled deck CLI
- `scripts/generate-slide-art.py` — optional pattern library and fallback renderer
- `diagram-design` skill — when available, for editorial architecture, flowchart, sequence, data, and security diagrams plus Mermaid/draw.io redraws

Keep the user's project or workspace as the shell working directory. Resolve each helper from the directory containing this `SKILL.md`, convert it to an absolute path, and do not `cd` into the installed skill before running it. In commands below, replace `<absolute-skill-dir>` with that real absolute directory; never type the placeholder literally.

## 1. Choose the delivery format

Honor an explicit format. Otherwise infer it from intended use:

- **HTML**: default for live talks, design fidelity, interaction, offline playback, browser sharing, or unspecified output.
- **Marp**: Markdown review, Git diffs, documentation-style decks, or fast PDF generation.
- **PPTX**: editable Microsoft PowerPoint, corporate handoff, or Office compatibility.
- **Existing framework**: preserve Slidev, Reveal.js, React, Marp, or a company template already used by the repository unless the user requests migration.

Do not ask the user to choose when the request implies a sensible default. State the assumption briefly and proceed.

## 2. Choose a template

Honor an explicit template name. Otherwise select the closest match to audience and communication goal. The default is `claude-editorial`; the legacy name `terminal-editorial` remains an alias.

List installed presets when needed:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" templates
node "<absolute-skill-dir>/scripts/slides-cli.mjs" templates --format pptx --json
```

Recommended selection:

| Template | Best use |
| --- | --- |
| `claude-editorial` | Technical talks, architecture reviews, AI and developer tooling |
| `executive-brief` | Leadership updates, strategy proposals, quarterly reviews |
| `cloud-architecture` | Infrastructure, platform engineering, security boundaries |
| `data-story` | Analytics, research findings, metrics, evidence-led narratives |
| `product-launch` | Product demos, launches, roadmaps, feature narratives |
| `dark-terminal` | Live demos, code walkthroughs, engineering deep dives |
| `incident-review` | Postmortems, impact timelines, root cause, remediation |

A supplied brand system or existing company template always takes precedence. Apply the brand-neutral visual-quality reference to every deck. Load the Claude Code-inspired visual system only when the selected template is `claude-editorial` / `terminal-editorial`, or when the user explicitly requests that style.

## 3. Inspect the source material

- Read every local file, URL, document, image, or code path the request depends on.
- For repository-based technical decks, identify actual architecture, dependencies, data flows, trust boundaries, deployment model, operations, costs, and risks.
- Preserve attribution for external facts, charts, screenshots, quotations, and benchmarks.
- Classify important claims as Verified, Derived, Assumption, or Proposal.
- Record source conflicts, dates, definitions, units, and limitations.
- Never copy confidential material into a deck unless the intended audience is authorized to receive it.
- Never fabricate metrics, logos, customer names, benchmarks, citations, product screenshots, research findings, or system components.

## 4. Lock the communication objective

Infer or establish:

- audience and current knowledge
- the decision, belief, or action the deck should create
- duration and page budget
- one-sentence audience promise
- central thesis
- one-sentence Direction Lock
- strongest evidence and weakest assumption
- language, brand, accessibility, confidentiality, and delivery constraints

Ask only for a missing constraint that materially changes the output. Otherwise record a reasonable assumption and continue.

When the request asks to explore, or multiple directions would create materially different decks, compare exactly three concise narrative forks. Do not create three full outlines. Select or synthesize one Direction Lock before implementation.

## 5. Plan before rendering

For non-trivial decks, use the sibling `deck-architect` and `visual-director` skills when available. Otherwise perform those roles inline.

Create a deck-local `deck-plan.md` before writing slide markup, CSS, Markdown slides, PptxGenJS, or visual-generation code. The directory may be scaffolded first so the plan has a stable path, but no slide implementation begins until the plan exists.

`deck-plan.md` is the presentation source of truth. It contains:

1. Presentation Contract
2. Evidence Ledger
3. Narrative Strategy and Direction Lock
4. Story Spine and section map
5. Narrative Review
6. Page-by-page Slide Blueprint
7. Content moved to notes or removed
8. Risks, assumptions, missing evidence, and source conflicts

For every slide record:

- id, section, role, and purpose
- claim-style title and optional supporting sentence
- internal audience takeaway
- evidence status, source, and source assets
- information shape
- visual form
- layout archetype
- geometry
- dominant element
- density and intended eye path
- visible content and speaker-note content
- transition in and transition out
- editing constraints

The page's information shape is selected before its visual form; the visual form is selected before the layout archetype. Three bullets are not automatically three cards.

A useful default story spine is:

```text
Reality → Tension → Reframe → Mechanism → Proof → Decision
```

Adapt it to the evidence and deck type. Run a section-continuity pass and record only unresolved same-section slide pairs in the Narrative Review. Repair a weak sequence by merging, cutting, reordering, or strengthening a claim—not by adding decorative arrows or presenter-style transition copy.

Every page has an internal audience takeaway, but a visible takeaway callout is default-off. Add one only when it states a source-grounded implication not already carried by the title and working area.

### Semantic layout selection

Use the bundled layout system to match information shape to visual form:

- tension/root cause → expectation-reality-root-cause, claim plus proof, or one-glance story
- protocol interaction → actor headers, lifelines, numbered messages, labeled request/response arrows
- cross-team handoff → swimlanes with owners, triggers, approvals, and failure paths
- causal chain → labeled cause-mechanism-effect path
- hierarchy → layers that change ownership, policy, or abstraction
- topology → real actors, systems, stores, and labeled connections
- trust boundary → named zones, crossings, and enforcement
- aligned records → one native table object
- artifact evidence → screenshot or source crop with two to four proof-oriented callouts
- number or trend → native metric or chart with definition, date, unit, source, and decision implication

For every `editorial-cover`, explicitly record `coverRight` as `none`, `artifact-right`, `proof-rail`, `signal-stack`, or `direct-system-cue`, plus the source or rationale. Whitespace is a valid design decision; when no source-backed artifact, proof, or signal improves the opening, leave the space empty.

When an opening asks how or why a mechanism works, separate proof from explanation: use the cover for concise sourced signals, then use the next page for the causal model. The handoff should move from evidence to mechanism to implication.

For a deck of 10 or more slides:

- use at least eight distinct layout archetypes when the content supports them
- never repeat the exact archetype on consecutive slides
- do not let the same visual family dominate more than two of any three consecutive slides
- keep card-grid and node-card pages at or below roughly 20%
- keep generic split-screen pages at or below roughly 35%
- avoid more than two consecutive slides with the same underlying geometry
- introduce a visible rhythm change every three to four slides through scale, density, background, or dominant visual
- interleave claim, evidence, architecture, sequence, risk, and decision pages

Inspect available archetypes with:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" layouts
node "<absolute-skill-dir>/scripts/slides-cli.mjs" layouts --json
```

### Review checkpoints

For interactive or high-stakes work, present the plan before full implementation and then render a small style sample: the cover plus one representative content page. This prevents narrative or visual drift before the complete deck is built.

For a one-shot workflow, do not create unnecessary hard pauses. Run the same plan audit and sample self-review, record unresolved assumptions, and continue to the complete deliverable.

## 6. Scaffold the output

Run the bundled helper from the user's workspace:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" init "Deck title" --format html --template claude-editorial
node "<absolute-skill-dir>/scripts/slides-cli.mjs" init "Deck title" --format marp --template data-story
node "<absolute-skill-dir>/scripts/slides-cli.mjs" init "Deck title" --format pptx --template executive-brief
```

The default destination is `slides/<slug>/`. Respect an explicit path or established repository convention. The generated `template.json` records the selected preset, palette, typography, pattern, layout system, and output format.

| Format | Minimum deliverable |
| --- | --- |
| HTML | `deck-plan.md`, `index.html`, `theme.css`, `slides.js`, `template.json`, `README.md` |
| Marp | `deck-plan.md`, `deck.md`, `theme.css`, `template.json`, `README.md` |
| PPTX | `deck-plan.md`, `deck.mjs`, `package.json`, `template.json`, `README.md`; generate the `.pptx` when dependency installation is permitted |

Keep assets inside the deck directory.

For every custom Python SVG, keep the plan, generator, and output together:

```text
assets/<visual>.visual.md
assets/<visual>.py
assets/<visual>.svg
```

The Markdown plan records source of truth, semantic model, composition, eye path, accessibility, editable slide content, and validation contract. Keep it synchronized with the Python and generated SVG.

## 7. Author against the plan

Treat `deck-plan.md` as an implementation contract.

Allowed without re-planning:

- fit, spacing, alignment, and type adjustments
- switching implementation medium when semantic meaning remains intact
- shortening visible copy without changing the claim
- moving nuance into notes
- accessibility and export fixes

Update the plan before implementation when changing:

- thesis or Direction Lock
- slide role, claim, evidence, or order
- section structure
- information shape or visual form
- source interpretation
- decision or recommendation

Use the selected template as a visual language, not a fixed page structure. Preserve color, typography, grid, spacing, and component behavior while changing composition according to each page's communication role.

### Content rules

- One idea per page.
- Use claim-style headlines rather than labels such as “Overview” or “Architecture”.
- Prefer diagrams, numbers, timelines, comparisons, short code, screenshots, quotations, and native tables over bullet walls.
- Keep most pages below roughly 35 visible words. Dense reference pages are explicit exceptions.
- Put nuance, caveats, transitions, and secondary evidence in speaker notes.
- Use useful alt text and text equivalents for meaningful visuals.
- Keep visible content in the requested language; preserve natural technical English terms when appropriate.
- Do not use decorative visuals without an information job.

### Cover rules

- Keep the title and audience promise dominant.
- The right half is optional and whitespace is valid.
- If used, include exactly one sourced artifact, compact proof rail, one operational signal, or tiny direct system cue.
- Never add a generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagram to fill space.
- Keep the right-side module secondary to the title, understandable within two seconds, and usually no wider than one-third of the canvas.
- Give every proof-rail number a role, source, date, and relationship to the other signals.
- For mechanism-led topics, use a next-page explanatory handoff instead of expanding the cover into a dashboard.

### Diagram Design integration

- When a slide needs a standalone architecture, flowchart, sequence, state, ER, timeline, swimlane, quadrant, loop, chart, data-flow, or security diagram, prefer the `diagram-design` skill rather than rebuilding generic boxes.
- For a presentation, set diagram size to `slide-16x9` when the content fits; otherwise use the smallest readable preset and split the visual.
- Keep slide title, explanation, source note, and speaker notes editable outside the SVG.
- Follow the selected diagram type reference and self-check.
- Use Mermaid/draw.io extractors for redraws; do not preserve a poor source layout merely because it already exists.

### Custom Python SVG rules

- Read the bundled Python SVG authoring protocol before implementing a source-specific visual.
- Default to a deck-local Python generator when the semantic model is unique; built-in drawing kinds are examples and fast fallbacks, not a closed catalog.
- Write or update `<visual>.visual.md` before changing geometry in `<visual>.py`.
- Keep title, explanation, source note, footer, and notes editable outside the SVG whenever possible.
- Prefer deterministic SVG with a stable `viewBox`, accessible `<title>` and `<desc>`, escaped text, and no external script or absolute local path.
- Promote a one-off visual into the shared generator only after it proves reusable across unrelated decks.

### Technical-deck rules

- Show system, trust, data-ownership, and operational boundaries.
- Label protocols, identities, stores, control plane, data plane, and failure paths.
- Separate current state, target state, and migration plan.
- Cover security, operability, cost, performance, maintainability, and tradeoffs when relevant.
- Keep code samples short and projection-safe.

### Format markers

- HTML: set `data-layout="<archetype>"` and `data-geometry="<geometry>"` on every slide.
- Marp: assign a matching slide class such as `<!-- _class: metric-spotlight -->`.
- PPTX: keep explicit `LAYOUT_SEQUENCE` and `GEOMETRY_SEQUENCE` arrays and use editable text, shapes, charts, and native tables.

## 8. Validate and improve

Run:

```bash
node "<absolute-skill-dir>/scripts/slides-cli.mjs" check <deck-path>
```

Then use the sibling `deck-reviewer` skill when available. Fix high-confidence Critical and Major findings and re-run validation.

Compare the rendered deck against `deck-plan.md`:

- claims, evidence status, and slide order match
- every slide's information shape and visual form remain intact
- layout archetypes and geometries match the plan or have a documented equivalent
- same-section transitions pass the Narrative Review
- native tables remain native
- visible takeaway callouts are not repeated boilerplate
- source facts, dates, units, labels, and boundaries remain accurate

Verify format-specific output:

- HTML: keyboard, click and swipe navigation; hash state; viewport scaling; notes; reduced motion; print-to-PDF; local assets; meaningful layout markers.
- Marp: frontmatter; separators; theme loading; layout classes; asset paths; HTML/PDF export.
- PPTX: generation succeeds; wide layout; editable elements; native tables; speaker notes; text bounds; portable fonts; deterministic filename; explicit layout and geometry sequences.
- Custom Python SVG: `.visual.md`, `.py`, and `.svg` agree; Python compiles; SVG parses; regeneration is deterministic; labels, sources, dates, and units match the plan.

Inspect every page at presentation size and thumbnail scale. Fix blank pages, overflow, clipping, overlap, missing assets, broken aspect ratios, unreadable type, ambiguous hierarchy, and meaningless decoration.

## 9. Hand off

Report:

- deck path, format, selected template, and `deck-plan.md` path
- slide count, unique archetype count, and geometry/rhythm summary
- preview or export command
- validation and review status
- unresolved assumptions, source conflicts, missing assets, or environment limitations

Do not bury the deliverable under a long process summary.
