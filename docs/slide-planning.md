# Planning-first slide generation

Claude Code Slides now treats slide generation as two separate problems:

1. **What should the audience understand or decide?**
2. **What visual structure explains that information fastest?**

The answer is recorded in `deck-plan.md` before slide markup or generation code is written.

This workflow was independently adapted after studying outline-first presentation systems, including the public planner/builder separation used by [`Ding522/make-ppt`](https://github.com/Ding522/make-ppt). No source code, templates, or visual assets are copied; the ideas are mapped into Claude Code Slides' own semantic layout catalog and portable Agent Skills.

## Workflow

```text
source material
  → communication contract
  → evidence ledger
  → Direction Lock
  → story spine and section continuity
  → per-slide semantic blueprint
  → visual form and layout archetype
  → HTML / Marp / editable PPTX
  → deterministic validation
  → plan-fidelity review
```

## `deck-plan.md` as the source of truth

For a non-trivial deck, the plan contains:

- audience, desired outcome, duration, page budget, and constraints
- audience promise, thesis, and Direction Lock
- Verified, Derived, Assumption, and Proposal evidence
- story spine, section map, and Narrative Review
- one blueprint per slide
- content moved to notes or removed
- unresolved risks, conflicts, and missing evidence

The builder may adjust spacing, alignment, fit, and implementation medium. It may not silently change the argument, evidence, slide order, or decision.

## Slide blueprint

```yaml
slide: 07
section: mechanism
role: protocol
purpose: Explain how the client receives tokens without storing a static secret.
claimTitle: Device Flow removes long-lived secrets from client config
audienceTakeaway: The client receives tokens without keeping a reusable secret on disk.
evidenceStatus: verified
source: auth-design.md#device-flow
informationShape: protocol interaction
visualForm: three-actor numbered sequence
layoutArchetype: flow-architecture
geometry: protocol-lifelines
dominantElement: sequence diagram
density: medium
eyePath: CLI → browser → gateway → issued token
transitionIn: The previous page establishes the plaintext-token failure mode.
transitionOut: The next page explains token guardrails and blast-radius control.
```

An internal `audienceTakeaway` is required for planning. A visible takeaway strip is not. Visible takeaway callouts are default-off when the title and visual already carry the implication.

## Information shape before layout

Do not start from a card grid. First classify the information:

| Information | Visual form | Typical archetype |
| --- | --- | --- |
| One decisive point | Claim plus one proof signal | `hero-statement` |
| Root cause | Expectation → reality → root cause | `split-narrative`, `infographic-story` |
| Number | Dominant metric with context | `metric-spotlight` |
| Trend | Native chart plus implication | `data-journey` |
| Protocol | Actors, lifelines, numbered messages | `flow-architecture`, `swimlane-process` |
| Handoff | Lanes, owners, triggers, approvals | `swimlane-process` |
| System topology | Actors, services, stores, labeled links | `system-map` |
| Trust boundary | Zones, crossings, enforcement | `architecture-boundary` |
| Feedback | Loop with outcome, cadence, guardrail | `operating-loop` |
| Aligned records | Native table | `comparison-matrix`, `evidence-claim` |
| Real artifact | Screenshot or source crop with proof-oriented callouts | `annotated-visual` |
| Decision | Signal, criteria, recommendation | `decision-path`, `decision` |

The archetype does not replace the visual form. A protocol sequence and an architecture map may both use boxes and arrows, but they explain different structures.

## Section continuity

A page sequence should behave like consecutive reasoning:

```text
symptom → root cause → mechanism → proof → risk → decision
```

For each adjacent pair, check:

- What premise or question remains open?
- Does the next page answer or advance it?
- Is evidence close to the claim it supports?
- Is a solution introduced before the audience understands the failure mode?
- Is the same point repeated with different nouns?

Record unresolved gaps in the plan's Narrative Review. Fix the story before trying to hide the gap with visual transitions.

## Layout rhythm

For a deck of 10 or more slides:

- use at least eight distinct archetypes when the content supports them
- never repeat the exact archetype consecutively
- keep card-grid and node-card pages at or below roughly 20%
- keep generic split pages at or below roughly 35%
- avoid more than two consecutive pages with the same geometry
- create a visible rhythm change every three to four slides
- alternate claims, mechanisms, evidence, risks, and decisions

Layout diversity follows meaning. It is not a checklist that forces unrelated archetypes into the deck.

## Review modes

For interactive or high-stakes work:

1. review `deck-plan.md`
2. render the cover and one representative content slide
3. confirm narrative and visual direction
4. build the remaining slides

For one-shot work, perform the same plan and sample audit without an unnecessary hard pause, then deliver the complete deck with unresolved assumptions disclosed.
