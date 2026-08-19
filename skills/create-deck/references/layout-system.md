# Claude Editorial layout system v3

A **theme** controls visual tokens: color, typography, surfaces, line treatment, and background pattern. A **layout archetype** controls the communication job and information hierarchy. A **visual form** expresses the information's actual shape. **Geometry** controls composition, dominant element, density, and eye path.

These layers are related but not interchangeable:

```text
message → evidence → information shape → visual form → layout archetype → geometry → implementation
```

Do not solve repetition by randomly moving boxes. Choose a layout because it matches the semantic job of the slide, then vary geometry only when the meaning changes.

For `editorial-cover`, the right half is **optional**. Empty space is valid. If the right half is used, it must earn its place with a real artifact, compact proof stack, direct system cue, or operational signal. Avoid a generic hub-and-spoke, concentric-circle, or orbit graphic that does not improve understanding within two seconds.

## Plan before composition

For non-trivial decks, the page sequence comes from `deck-plan.md`. The visual director consumes these planning fields:

- role and purpose
- claim title and internal audience takeaway
- evidence status and source
- information shape
- visual form
- layout intent
- dominant element
- density
- transition in and transition out
- editing constraints

The visual director resolves the final archetype, geometry, eye path, and implementation medium. The builder must not use layout selection as an excuse to rewrite the argument.

## Information shape comes first

Ask:

> What structure explains this information fastest?

Never start with:

> How can these bullets become cards?

Three bullets are not automatically three cards. They may be three stages, three risks, three options, three evidence sources, or three mechanisms that deserve separate pages.

### Semantic selection matrix

| Information shape | Preferred visual form | Strong archetype candidates | Avoid |
| --- | --- | --- | --- |
| One decisive point | Large claim, one proof signal | `hero-statement`, `asymmetric-editorial` | Paragraphs and equal-weight widgets |
| Tension or root cause | Expectation → reality → root cause, or a sharp contrast | `hero-statement`, `split-narrative`, `infographic-story` | Invented drama or unrelated before/after states |
| One number | Dominant metric with definition and context | `metric-spotlight` | A large number with no unit, date, source, or implication |
| Trend over time | Native chart plus one decision implication | `data-journey`, `evidence-claim` | Decorative chart chrome or unlabeled axes |
| Real artifact | Screenshot, log, architecture crop, or document excerpt with callouts | `annotated-visual`, `evidence-claim` | Using the artifact as decoration |
| Parallel categories | Columns, labeled bands, or a compact matrix | `comparison-matrix`, `split-narrative` | Treating categories as sequential steps |
| Matched current and target states | Side-by-side states on shared criteria with one delta | `before-after` | Comparing unmatched criteria |
| Competing options | Fair shared-axis comparison plus recommendation | `comparison-matrix`, `decision` | Highlighting the winner before the comparison is credible |
| Chronology or roadmap | Dated spine or capability horizon | `timeline`, `roadmap-horizon` | Dates that do not change meaning or capability |
| Ordered process | Numbered stages with state or ownership change | `process-steps`, `flow-architecture` | A workflow made from unrelated nouns |
| Protocol interaction | Actor headers, lifelines, numbered request/response arrows | `flow-architecture`, `swimlane-process` | Generic node cards, unlabeled arrows, or an architecture diagram |
| Cross-team handoff | Lanes, owners, triggers, approvals, and failure paths | `swimlane-process` | Lane crossings without owner or trigger |
| Causal chain | Cause → mechanism → effect with labeled links | `infographic-story`, `flow-architecture` | A timeline when time is not the organizing principle |
| Hierarchy or layered responsibility | Stacked layers with ownership or policy change | `layered-architecture` | Layers that exist only for visual symmetry |
| System topology | Actors, services, stores, and explicit connections | `system-map` | A logo cloud or unlabeled hub |
| Trust, tenancy, or network boundary | Zones, crossings, enforcement, control/data planes | `architecture-boundary` | A boundary with no named crossing or control |
| Feedback that changes the next cycle | Closed loop with outcome, cadence, and guardrail | `operating-loop` | Drawing a loop for a process that does not feed back |
| State and transition | Named states, triggers, guards, and terminal outcomes | `process-steps`, `decision-path` | A sequence with no state semantics |
| Decision | Signal → criteria → action, or recommendation with alternatives | `decision-path`, `decision` | A menu of options with no ask |
| Risk | Priority, likelihood, impact, mitigation, owner, review point | `risk-matrix` | A red list with no response |
| Column-aligned records | One native table object | `comparison-matrix`, `evidence-claim` | Rebuilding a semantic table from text boxes |
| Code or terminal proof | Short code/command paired with visible result | `code-walkthrough`, `evidence-claim` | Code used as atmosphere |
| Quotation | Short source-backed quote plus one implication | `quote-evidence` | Anonymous or paragraph-length quotes |
| Close | One memorable conclusion and one concrete next action | `closing-manifesto`, `decision` | A summary grid after the ask |

The archetype is selected after the visual form. A protocol sequence and a system topology may both contain boxes and arrows, but they explain different structures and must not be rendered as the same generic diagram.

## Visual Grammar v3

Every slide should declare these properties before implementation:

1. **Role** — opening, statement, evidence, system, comparison, sequence, risk, decision, or close.
2. **Audience takeaway** — the internal sentence the audience should remember.
3. **Evidence** — Verified, Derived, Assumption, or Proposal, with source or qualification.
4. **Information shape** — what the content actually is.
5. **Visual form** — the structure that explains that shape.
6. **Archetype** — the catalog entry that supports the page's communication job.
7. **Dominant element** — claim, number, artifact, diagram, code, quotation, table, or decision.
8. **Eye path** — where the audience looks first, second, and last.
9. **Geometry** — full-bleed, rail, stack, scene, hub, branch, loop, matrix, timeline, lifelines, lanes, or another named structure.
10. **Density** — low, medium, or high.

A deck can use many class names and still feel repetitive when most pages are the same left-copy/right-card split. Review underlying geometry and dominant element, not only archetype names.

### Slide layout blueprint

Record a compact blueprint for every page:

```yaml
slide: 07
role: mechanism
claimTitle: Device Flow removes long-lived secrets from client config
informationShape: protocol interaction
visualForm: three-actor numbered sequence
archetype: flow-architecture
geometry: protocol-lifelines
dominantElement: sequence diagram
density: medium
eyePath: CLI → browser → gateway → issued token
evidenceStatus: verified
source: auth-design.md#device-flow
transitionIn: plaintext-token failure mode
transitionOut: token guardrails and blast-radius control
```

The plan records design decisions, not implementation coordinates. Exact measurements belong in HTML, CSS, Marp, PptxGenJS, or a deck-local visual generator.

## Core archetypes

| Archetype | Use it for | Dominant composition |
| --- | --- | --- |
| `editorial-cover` | Cover or section opening | Large title, one promise, restrained metadata, optional meaningful right-side module |
| `hero-statement` | Thesis, tension, big idea | One decisive claim with a compact proof rail |
| `chapter-index` | Agenda or chapter map | Oversized chapter number with a short editorial index |
| `asymmetric-editorial` | Context or provocation | Offset copy and deliberate visual imbalance |
| `split-narrative` | Explanation plus evidence | Claim on one side, proof or visual on the other |
| `metric-spotlight` | KPI, outcome, scale | One dominant number with contextual measures |
| `evidence-claim` | Research, benchmark, screenshot | Evidence anchored next to the conclusion it proves |
| `annotated-visual` | Product or architecture walkthrough | One large artifact with two to four numbered callouts |
| `quote-evidence` | Customer or expert voice | Short quotation, attribution, and one implication |
| `infographic-story` | One-glance explanation | Problem, mechanism, and outcome as one visual movement |
| `data-journey` | Progress or KPI story | Dominant state connected to movement and decision |
| `dashboard-story` | Operational status | One state, one progress signal, and one next action |
| `layered-architecture` | Platform or control-plane model | Stacked layers with ownership and boundaries |
| `flow-architecture` | Data flow, request path, protocol | Directional nodes or actors with direct labels |
| `system-map` | Agent platform or ecosystem | Central capability, surrounding actors, explicit boundary |
| `architecture-boundary` | Security or tenancy review | Control/data planes around a trust boundary |
| `before-after` | Migration or transformation | Matched states with one explicit delta |
| `comparison-matrix` | Technology selection or aligned records | Shared criteria across options or a native table |
| `decision-path` | Approval or operating choice | Signal, named criteria, and proceed/pause branch |
| `decision` | Funding or architecture decision | Recommendation, alternatives, and cost of waiting |
| `timeline` | Roadmap or chronology | Milestones on one spine with current phase marked |
| `roadmap-horizon` | Strategy or maturity | Now/next/later on a perspective path |
| `process-steps` | CI/CD, state change, delivery process | Ordered stages with changing state or responsibility |
| `swimlane-process` | Cross-team or human-in-loop flow | Handoffs across actors, approvals, and failure points |
| `operating-loop` | AI operations or continuous improvement | Closed loop around outcome, cadence, and guardrail |
| `code-walkthrough` | CLI, API, implementation evidence | Projection-safe code paired with its visible result |
| `risk-matrix` | Security or readiness | Priority risk plus mitigation and owner |
| `closing-manifesto` | Final action or conclusion | One final line and one concrete next step |

## Reusable composition recipes

These are implementation recipes, not additional archetype names.

### Expectation → reality → root cause

Use when the audience first needs to see why an apparently attractive path fails.

- Make the expectation and reality concise.
- Give the root cause the strongest visual weight.
- Add one source-backed artifact, terminal crop, or metric only if it proves the root cause.
- Use `hero-statement`, `split-narrative`, or `infographic-story` according to density.
- Do not turn the three beats into identical cards.

### Protocol sequence

Use for authentication, API exchange, agent/tool calls, event handshakes, and request/response behavior.

- Place actors across the top.
- Use dashed lifelines when time flows vertically.
- Number interactions.
- Label every arrow with data, protocol, identity, or decision.
- Distinguish request, response, asynchronous polling, and failure paths.
- Keep the sequence readable from presentation distance; split long protocols across pages.
- Use `flow-architecture` for a compact path or `swimlane-process` when ownership and handoffs dominate.

### Screenshot plus analysis

- Let the artifact dominate.
- Limit annotations to two through four.
- Each callout states what the artifact proves, not merely what it contains.
- Crop irrelevant chrome, preserve source context, and avoid covering key UI.
- Use `annotated-visual` or `evidence-claim`.

### Metric plus trend

- Define the metric, unit, time window, and source.
- Use one dominant state and one movement signal.
- End with the decision implication.
- Use `metric-spotlight` when state matters most and `data-journey` when movement matters most.

### Native table

Content with column headers, repeated records, and cross-row alignment is a semantic table.

- Implement one native table object in PPTX and an actual table in HTML/Marp.
- Keep headers, ordered rows, width ratios, alignment, and safe split points in the plan.
- If the table cannot fit at projection-safe type size, simplify wording and split it across pages with the header repeated.
- Do not hand-build an ordinary table from text boxes and rules.
- A free-positioned matrix is appropriate only when cells need connectors, overlap, or materially different internal structures.

### Code or terminal evidence

- Show only the lines the audience must read.
- Pair commands with the output or effect they demonstrate.
- Highlight the decisive token, diff, error, or result.
- Keep code editable when the format allows.
- Use `code-walkthrough`; use `evidence-claim` when the artifact is proof rather than instruction.

## Selection workflow

1. Confirm the page's role and claim title.
2. Name the internal audience takeaway.
3. Identify the strongest evidence and its status.
4. Classify the information shape.
5. Select the visual form.
6. Choose the archetype whose hierarchy supports that form.
7. Decide the dominant element, density, geometry, and eye path.
8. Compare the proposed page with the previous two and next one.
9. Put caveats, definitions, and secondary evidence in notes instead of adding containers.
10. Review the complete sequence at thumbnail scale before implementation.

If two archetypes seem plausible, choose the one that makes the evidence-to-claim relationship clearer, not the one that creates superficial variety.

## Diversity and rhythm rules

For a deck of 10 or more slides:

- Use at least **8 distinct archetypes** when the content supports them.
- Never repeat the exact archetype on consecutive slides.
- Do not let the same visual family dominate more than two of any three consecutive slides.
- Keep card-grid or node-card pages at or below roughly **20%** of the deck.
- Keep generic split-screen pages at or below roughly **35%** of the deck.
- Do not repeat the same underlying geometry for more than **two consecutive slides**, even when archetype names differ.
- Introduce a visible rhythm change every **three to four slides** through scale, density, background, or dominant visual.
- Interleave claims with evidence, systems, sequences, risks, and decisions.
- Repeat a layout only when the semantic task genuinely repeats, such as matched case studies or recurring chapter openers.

Rhythm is not random novelty. A strong sequence often alternates:

```text
low-density claim → medium-density mechanism → evidence page → rhythm break
```

### Geometry audit

Record one geometry label for every page, for example:

```text
full-bleed · hero-plus-rail · index-rail · matched-comparison
stacked-layers · metric-stage · hub-and-spoke · evidence-anchor
node-flow · protocol-lifelines · full-visual-callouts · scene-journey
terminal-stage · metric-to-trend · quote-stage · matrix
branch-path · circular-loop · linear-spine · swimlanes
quadrant-plus-register · dark-full-bleed
```

A strong deck demonstrates distinct reading patterns, not merely distinct CSS classes.

## Section continuity and layout handoff

Layout should reinforce the story's unresolved question.

- A symptom page should create the need for the root-cause page.
- A root-cause page should make the mechanism page necessary.
- A mechanism page should hand off to proof, operations, or risk.
- Evidence should sit near the claim it validates.
- A decision page should inherit explicit criteria from the evidence and risk pages.

When a transition is weak, first repair the narrative in `deck-plan.md`. Do not use decorative arrows or host-style transition copy to disguise a sequence problem.

## Flow architecture rules

Keep a `flow-architecture` page to three through six major nodes or actors. Split a longer process or use a more suitable sequence archetype.

- In HTML, let `.flow-path` create one automatic column per `.flow-stop`; do not restore a fixed `repeat(4, ...)` grid or use arbitrary vertical node offsets.
- Put one `.flow-transition` inside every non-final `.flow-stop`. A flow with `n` nodes has exactly `n - 1` transition labels.
- Keep connectors between node markers. They must not cross headings, descriptions, or labels.
- Label data, protocol, identity, decision, or ownership on every meaningful edge.
- Render or preview every customized flow after changing node count.

For protocol lifelines, actor ownership and message order take precedence over the generic horizontal flow recipe.

## Cover execution rules

Use `editorial-cover` to establish the promise, not to preview every topic.

- The right half is **optional**. Prefer whitespace over filler.
- If used, choose exactly one `coverRight` pattern:
  - **`artifact-right`** — one screenshot, code crop, product frame, or architecture fragment that the deck will revisit.
  - **`proof-rail`** — two to four evidence signals such as metric, owner, constraint, or date.
  - **`signal-stack`** — one core signal with a short caption.
  - **`direct-system-cue`** — a tiny labeled boundary or flow only when the thesis is specifically about that system.
- Keep the module secondary to the title and usually no wider than one-third of the canvas.
- Never add an unsourced generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagram to fill the right side.
- A cover visual must be understandable within two seconds and remain readable at thumbnail scale and in print.
- If no meaningful module exists, leave the space empty.

### Cover-to-mechanism handoff

A proof rail establishes stakes; it does not explain the full causal model.

When the title asks how, why, or what keeps a system moving:

1. keep the cover concise
2. use the proof rail only for source-backed signals with explicit roles and dates
3. use the next page for the mechanism with `operating-loop`, `infographic-story`, `flow-architecture`, `swimlane-process`, or `system-map`
4. move from **evidence → causal model → implication**

Do not repeat the proof rail on the next page or expand the cover into a dense dashboard.

## Diagram grammar

Use a small set of meaningful primitives:

- **Scene** for a human or agent transformation.
- **Boundary** for trust, network, tenancy, or ownership.
- **Hub** for orchestration and capability maps.
- **Path** for flow, migration, or decision.
- **Lifelines** for protocol interaction.
- **Lanes** for ownership and handoff.
- **Loop** only when feedback changes the next cycle.
- **Rail** for secondary proof or operating detail.
- **Annotation** for explaining a real artifact.

Use direct labels. An arrow names data, identity, protocol, decision, or ownership. A box represents a real state, boundary, system, or responsibility, not merely visual order.

## Agent-authored Python SVG assets

When a page needs a content-specific vector visual, read [the Python SVG authoring protocol](python-svg-authoring.md) and keep the source set together:

```text
slides/<deck>/assets/<visual>.visual.md
slides/<deck>/assets/<visual>.py
slides/<deck>/assets/<visual>.svg
```

Choose the medium before drawing:

- screenshots for real interfaces and artifacts
- native charts for quantitative relationships backed by data
- native editable shapes for simple corporate diagrams
- deck-local Python SVG for content-specific mechanisms, architectures, journeys, boundaries, or scenes
- whitespace when the proposed visual has no information job

The Markdown plan defines the audience takeaway, source of truth, semantic model, composition, eye path, labels, accessibility, editable outside content, and validation contract. Built-in drawing kinds are examples and fast fallbacks, not a closed catalog.

Keep slide titles, explanations, sources, footers, and speaker notes editable outside the SVG whenever possible.

## Format mapping

- **HTML:** add `data-layout="<archetype>"` and `data-geometry="<geometry>"` to every slide.
- **Marp:** assign a matching slide class such as `<!-- _class: metric-spotlight -->`.
- **PPTX:** keep explicit `LAYOUT_SEQUENCE` and `GEOMETRY_SEQUENCE` arrays and construct text, callouts, tables, and labels as editable objects.

These markers make review deterministic without forcing every deck into identical coordinates.
