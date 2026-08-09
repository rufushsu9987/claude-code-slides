# Claude Editorial layout system v2

A **theme** controls visual tokens: color, typography, surfaces, line treatment, and background pattern. A **layout archetype** controls information architecture: what dominates the page, how the eye moves, which geometry carries meaning, and how evidence becomes a decision.

Do not solve repetition by randomly moving boxes. Choose a layout because it matches the communication job of the slide, then vary the geometry only when the meaning changes.

For `editorial-cover`, the right half is **optional**. Empty space is acceptable. If you use the right half, it must earn its place by carrying meaning: a real artifact, a compact proof stack, a direct system cue, or one operational signal. Avoid unlabeled orbit diagrams, abstract circles, and decorative structures that do not improve the audience's understanding within two seconds.

## Visual Grammar v2

Every slide should declare five properties before implementation:

1. **Role** — opening, statement, evidence, system, comparison, sequence, risk, decision, or close.
2. **Dominant element** — claim, number, artifact, diagram, code, quotation, or decision.
3. **Eye path** — where the audience looks first, second, and last.
4. **Geometry** — full-bleed, rail, stack, scene, hub, branch, loop, matrix, timeline, or another named structure.
5. **Density** — low, medium, or high. Dense pages are intentional reference pages, not the default.

A deck can technically use twenty different class names and still feel repetitive when most pages are the same left-copy/right-card split. Review **geometry**, not only archetype names.

## Core archetypes

| Archetype | Use it for | Dominant composition |
| --- | --- | --- |
| `editorial-cover` | Cover or section opening | Large title, one promise, restrained metadata, and an optional meaningful right-side module |
| `hero-statement` | Thesis, tension, big idea | One decisive claim with a compact proof rail |
| `chapter-index` | Agenda or chapter map | Oversized chapter number with a short editorial index |
| `asymmetric-editorial` | Context or provocation | Offset copy and deliberate visual imbalance |
| `split-narrative` | Explanation plus evidence | Claim on one side, proof or visual on the other |
| `metric-spotlight` | KPI, outcome, scale | One dominant number with contextual measures |
| `evidence-claim` | Research, benchmark, screenshot | Evidence anchored next to the conclusion it proves |
| `annotated-visual` | Product or architecture walkthrough | One large artifact with two to four numbered callouts |
| `quote-evidence` | Customer voice or expert perspective | Short quotation, attribution, and one implication |
| `infographic-story` | One-glance explainer | Problem → human/agent workflow → concrete outcome |
| `data-journey` | Progress or KPI story | Dominant state connected to movement and a decision |
| `dashboard-story` | Operational status | One state, one progress signal, and one next action |
| `layered-architecture` | Platform or control-plane model | Stacked layers with ownership and boundaries |
| `flow-architecture` | Data flow or request path | Directional nodes with direct labels |
| `system-map` | Agent platform or ecosystem | Central hub, surrounding capabilities, explicit boundary |
| `architecture-boundary` | Security or tenancy review | Control/data planes arranged around a trust boundary |
| `before-after` | Migration or transformation | Matched states with one explicit delta |
| `comparison-matrix` | Technology selection | Options evaluated on a shared axis |
| `decision-path` | Approval or operating choice | Signal → named criteria → proceed or pause |
| `decision` | Funding or architecture decision | Recommendation, alternatives, and cost of waiting |
| `timeline` | Roadmap or chronology | Milestones on one spine with current phase marked |
| `roadmap-horizon` | Strategy or maturity | Now/next/later on a perspective path |
| `process-steps` | CI/CD or delivery process | Ordered stages with changing state or responsibility |
| `swimlane-process` | Cross-team or human-in-loop flow | Handoffs across actors, approvals, and failure points |
| `operating-loop` | AI operations or continuous improvement | Closed loop around one outcome, cadence, and guardrail |
| `code-walkthrough` | CLI, API, implementation evidence | Projection-safe code paired with its visible result |
| `risk-matrix` | Security or readiness | Priority risk plus mitigation and owner |
| `closing-manifesto` | Final action or memorable conclusion | One final line and one concrete next step |

## Cover execution rules

Use `editorial-cover` to establish the promise of the talk, not to preview every topic.

- The right half is **not mandatory**. Prefer whitespace over filler.
- If the right half exists, choose exactly **one** meaningful pattern:
  - **Artifact-right** — one screenshot, product frame, code crop, or architecture fragment that the talk will revisit.
  - **Proof-rail** — two to four evidence chips such as metric, owner, constraint, or date.
  - **Signal-stack** — one core signal with a short caption, for example “3 bottlenecks”, “12 services”, or “T+2 handoff”.
  - **Direct system cue** — a tiny labeled boundary or flow only when the talk itself is about that system.
- Any diagram on the cover must use direct labels and a single takeaway.
- Never place a generic hub-and-spoke, concentric-circle, or orbit graphic on the cover unless the cover thesis is specifically about orchestration or boundaries.
- If the title is already visually dominant, keep the right module quieter than the left and smaller than one-third of the slide width.
- The cover should still read well in thumbnail view and in print.

### Cover-to-mechanism handoff

A proof rail establishes stakes; it should not also carry the full causal model. When the title asks **how**, **why**, or **what keeps the system moving**, keep the cover concise and plan the next page as `operating-loop`, `infographic-story`, `flow-architecture`, or `system-map`.

- Use `proof-rail` on the cover for two to four source-backed signals with explicit roles such as asset base, liquidity, or per-share effect.
- State how the signals relate. If they use different disclosure dates, label that clearly and do not imply a single synchronized snapshot.
- Use a content-specific Python SVG on the next page when a mechanism, architecture, journey, or boundary explains the thesis faster than prose.
- Write `<visual>.visual.md` before `<visual>.py`, then generate `<visual>.svg`. Use a built-in kind only when it already matches the communication job; do not force the content into a fixed renderer.
- Do not repeat the same proof rail on the mechanism page. The handoff should move from **evidence → causal model → implication**.

## Selection workflow

1. Label each page by communication role.
2. Name the one sentence the audience should remember.
3. Choose the dominant element that proves or carries that sentence.
4. Select the archetype whose eye path makes the takeaway easiest to understand.
5. Check the proposed geometry against the previous two slides.
6. Put nuance, caveats, definitions, and secondary evidence in notes rather than adding more containers.
7. Review the sequence at thumbnail scale before implementation.

## Diversity rules

For a deck of 10 or more slides:

- Use at least **8 distinct archetypes** when the content supports them.
- Never repeat the exact archetype on consecutive slides.
- Do not let the same visual family dominate more than two of any three consecutive slides.
- Keep card-grid or node-card pages at or below roughly **20%** of the deck.
- Keep generic split-screen pages at or below roughly **35%** of the deck.
- Do not repeat the same underlying geometry for more than **two consecutive slides**, even when the archetype names differ.
- Introduce a visible rhythm change every **three slides** through scale, density, background, or dominant visual—not decorative novelty.
- Interleave editorial claims with evidence, systems, sequences, risks, and decisions.
- Repeat a layout only when the semantic task genuinely repeats, such as matched case studies or recurring chapter openers.

### Geometry audit

For each slide, record one geometry label such as:

```text
full-bleed · hero-plus-rail · index-rail · matched-comparison
stacked-layers · metric-stage · hub-and-spoke · evidence-anchor
node-flow · full-visual-callouts · scene-journey · terminal-stage
metric-to-trend · quote-stage · matrix · branch-path
circular-loop · linear-spine · quadrant-plus-register · dark-full-bleed
```

A strong 20-page starter should demonstrate many distinct geometries, not merely many CSS class names.

## Recommended architecture-review sequence

```text
editorial-cover
→ hero-statement
→ chapter-index
→ before-after
→ layered-architecture
→ system-map
→ architecture-boundary
→ flow-architecture
→ code-walkthrough
→ metric-spotlight
→ evidence-claim
→ data-journey
→ risk-matrix
→ decision-path
→ roadmap-horizon
→ closing-manifesto
```

Adapt the sequence to the evidence. Do not fabricate a metric, customer quotation, code sample, or architecture boundary merely to fill a layout.

## Diagram grammar

Prefer a small set of meaningful visual primitives:

- **Scene** for a human or agent transformation story.
- **Boundary** for trust, network, tenancy, or ownership.
- **Hub** for orchestration and capability maps.
- **Path** for flow, decision, or migration.
- **Loop** only when feedback changes the next cycle.
- **Rail** for secondary proof or operating detail.
- **Annotation** for explaining a real artifact.

Use direct labels. An arrow should name data, identity, protocol, decision, or ownership. A box should represent a real boundary, state, or responsibility—not simply create visual order.

## Agent-authored Python SVG assets

When a page needs a content-specific vector visual, the default workflow is to let Codex or Claude Code plan and write a small deck-local Python generator. Read the [Python SVG authoring protocol](python-svg-authoring.md).

Keep the source set together:

```text
slides/<deck>/assets/<visual>.visual.md
slides/<deck>/assets/<visual>.py
slides/<deck>/assets/<visual>.svg
```

The Markdown file defines the audience takeaway, source of truth, semantic model, composition, eye path, labels, accessibility, editable outside content, and validation contract. The Python file implements geometry. The SVG is generated output.

Choose the medium before drawing:

- use screenshots for real interfaces and artifacts
- use charts for quantitative relationships backed by data
- use native editable shapes for simple corporate diagrams
- use agent-authored Python SVG for content-specific mechanisms, architectures, journeys, boundaries, or scenes
- use whitespace when the proposed visual has no information job

A typical workflow is:

```bash
cp templates/python-svg-plan.md   slides/example/assets/capital-engine.visual.md

python3 slides/example/assets/capital-engine.py   --output slides/example/assets/capital-engine.svg
```

`scripts/generate-slide-art.py` remains a tested pattern library and fast fallback. Its built-in kinds demonstrate accessible metadata, deterministic sketch and clean strokes, arrows, loops, boundaries, paths, scenes, and layout-safe SVG output. They are examples, not an exhaustive catalog. Create a deck-local composition whenever the source material requires a different semantic model.

Promote a custom visual into the shared generator only after the pattern proves reusable across multiple unrelated decks. Keep slide titles, explanation, source notes, layout markers, footers, and speaker notes editable in the target format; the SVG should remain the visual anchor rather than a flattened slide.

## Format mapping

- **HTML:** add `data-layout="<archetype>"` and optionally `data-geometry="<geometry>"` to every slide.
- **Marp:** assign a slide class such as `<!-- _class: metric-spotlight -->`.
- **PPTX:** keep explicit `LAYOUT_SEQUENCE` and `GEOMETRY_SEQUENCE` arrays and construct text, callouts, and labels as editable shapes.

These markers make review deterministic without constraining the final visual execution.
