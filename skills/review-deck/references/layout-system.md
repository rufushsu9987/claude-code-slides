# Claude Editorial layout system

A **template** controls visual tokens such as color, typography, surface treatment, and background pattern. A **layout archetype** controls information architecture: what dominates the page, how the eye moves, and how the content is compared or sequenced.

Do not solve layout repetition by randomly moving boxes. Choose a layout because it matches the job of the slide.

## Core archetypes

| Archetype | Use it for | Dominant composition |
| --- | --- | --- |
| `editorial-cover` | Cover or section opening | Large title, one promise, restrained metadata |
| `hero-statement` | Thesis, tension, big idea | One decisive claim with a compact proof rail |
| `asymmetric-editorial` | Context, provocation, chapter transition | Offset copy and visual weight |
| `split-narrative` | Explanation plus evidence | Claim on one side, proof or visual on the other |
| `metric-spotlight` | KPI, outcome, scale | One dominant number with two contextual measures |
| `evidence-claim` | Research, benchmark, quotation, screenshot | Evidence anchored next to the conclusion it proves |
| `layered-architecture` | Platform, control plane, layer model | Stacked layers with ownership and boundaries |
| `flow-architecture` | Data flow, request path, agent workflow | Directional nodes with direct labels |
| `before-after` | Migration, transformation, current versus target | Matched states with one explicit delta |
| `comparison-matrix` | Technology selection and trade-offs | Options evaluated on a shared axis |
| `timeline` | Roadmap, migration, incident chronology | Milestones on one spine with current phase marked |
| `process-steps` | CI/CD, operating model, delivery process | Ordered stages with changing responsibility or state |
| `code-walkthrough` | CLI, API, implementation evidence | Projection-safe code paired with its outcome |
| `risk-matrix` | Security, delivery risk, readiness | Probability and impact plus mitigation and owner |
| `decision` | Approval, funding, architecture decision | Recommendation, alternatives, and cost of waiting |
| `closing-manifesto` | Final action or memorable conclusion | One final line and one concrete next step |

## Selection workflow

1. Label each page by role: opening, context, tension, evidence, system, sequence, risk, decision, or close.
2. Select the archetype that makes that role easiest to understand.
3. Identify the single dominant element: claim, number, diagram, comparison, code, or decision.
4. Put explanation and caveats in notes instead of adding more containers.
5. Review the whole sequence for rhythm and repetition before implementation.

## Diversity rules

For a deck of 10 or more slides:

- Use at least **8 distinct archetypes**.
- Do not repeat the exact archetype on consecutive slides.
- Do not use the same visual family for more than two of any three consecutive slides.
- Keep card-grid or node-card pages at or below roughly **20%** of the deck.
- Introduce a visible rhythm change every **3–4 slides** through scale, density, background, or dominant visual—not decorative novelty.
- Interleave editorial claim pages with evidence, architecture, sequence, or decision pages.
- Repeat a layout only when the semantic task genuinely repeats, such as a recurring chapter opener or matched case study.

## Recommended architecture-review sequence

```text
editorial-cover
→ hero-statement
→ before-after
→ layered-architecture
→ flow-architecture
→ code-walkthrough
→ metric-spotlight
→ risk-matrix
→ timeline
→ closing-manifesto
```

Adapt the sequence to the evidence. Do not force a missing metric, code sample, or architecture diagram merely to fill a layout.

## Format mapping

- **HTML:** add `data-layout="<archetype>"` to each slide and use a matching layout class when useful.
- **Marp:** assign a slide class such as `<!-- _class: metric-spotlight -->`.
- **PPTX:** keep an explicit `LAYOUT_SEQUENCE` array and build each slide from editable text and shapes.

These markers make layout review deterministic without constraining the final visual execution.
