# Claude Editorial layout system v2

A **theme** controls visual tokens: color, typography, surfaces, line treatment, and background pattern. A **layout archetype** controls information architecture: what dominates the page, how the eye moves, which geometry carries meaning, and how evidence becomes a decision.

Do not solve repetition by randomly moving boxes. Choose a layout because it matches the communication job of the slide, then vary the geometry only when the meaning changes.

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
| `editorial-cover` | Cover or section opening | Large title, one promise, restrained metadata |
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

## Python-assisted SVG assets

Use `scripts/generate-slide-art.py` when a page benefits from a reusable vector scene instead of a screenshot or a cluster of editable cards.

```bash
python3 scripts/generate-slide-art.py \
  --kind agent-journey \
  --style sketch \
  --title "From scattered context to visible progress" \
  --output slides/example/assets/agent-journey.svg
```

Built-in kinds:

```text
agent-journey · infographic · data-journey · decision-path
system-map · architecture-boundary · operating-loop
swimlane-process · roadmap-horizon
```

`sketch` uses deterministic double strokes for an editorial workshop feel. `clean` uses exact single strokes for formal architecture decks. Keep slide titles, source notes, layout markers, and speaker notes editable in the target format; the SVG should remain the visual anchor, not the entire slide flattened into an image.

## Format mapping

- **HTML:** add `data-layout="<archetype>"` and optionally `data-geometry="<geometry>"` to every slide.
- **Marp:** assign a slide class such as `<!-- _class: metric-spotlight -->`.
- **PPTX:** keep explicit `LAYOUT_SEQUENCE` and `GEOMETRY_SEQUENCE` arrays and construct text, callouts, and labels as editable shapes.

These markers make review deterministic without constraining the final visual execution.
