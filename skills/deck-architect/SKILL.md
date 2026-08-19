---
name: deck-architect
description: Plan the narrative, audience journey, slide sequence, evidence, and decision structure for a presentation before implementation. Use for new decks, major rewrites, executive briefs, technical talks, and source-to-slides conversion.
---

# Plan the deck before it is built

Read [the storytelling and slide-planning system](references/storytelling.md), resolved relative to this skill directory. Produce a narrative and slide blueprint, not slide implementation code.

For a non-trivial deck, write or update a deck-local `deck-plan.md`. When no workspace path exists, return the same plan in the response so the orchestrating workflow can persist it before authoring slides.

## 1. Build the communication contract

Identify:

- audience, context, and current knowledge
- the decision, belief, or action the presentation should create
- duration and implied page budget
- one-sentence audience promise
- central thesis
- one-sentence Direction Lock
- strongest evidence and weakest unsupported assumption
- language, brand, confidentiality, accessibility, and format constraints

Ask only when a missing constraint materially changes the story. Otherwise record the assumption and continue.

## 2. Resolve narrative direction

When the request explicitly asks to explore, or multiple angles would create materially different decks, compare exactly three concise narrative forks. For each, state the thesis, best-fit audience or use case, high-level flow, strongest evidence, and main trade-off.

Do not write multiple full outlines. Select or synthesize one Direction Lock before continuing. Skip this step when the direction is already clear.

## 3. Inspect and classify evidence

Read every source the request depends on. Classify important claims as:

- Verified
- Derived
- Assumption
- Proposal

Record source, date, unit, what the evidence proves, and any limitation or conflict. Never invent numbers, benchmarks, dates, outcomes, systems, customers, quotations, or citations.

## 4. Design the story spine

Choose a defensible sequence rather than preserving source order. A useful default is:

```text
Reality → Tension → Reframe → Mechanism → Proof → Decision
```

Adapt it to the deck type. Group pages into small sections with a clear throughline. Every page must have a unique informational job.

Run a section-continuity pass:

- Does each page answer or advance the previous page?
- Is evidence shown close to the claim it supports?
- Does the deck jump from symptom to solution without root cause or mechanism?
- Are conclusions shown before their support?
- Are two pages repeating the same point?

Record a compact Narrative Review. Name only unresolved slide pairs, the gap, and the least disruptive adjustment.

## 5. Create the slide blueprint

For every page include:

- slide id and section
- role and purpose
- claim-style title
- optional supporting sentence
- internal audience takeaway
- evidence status, source, and source assets
- information shape
- visual form
- layout intent: dominant element, desired density, and intended eye path
- visible content
- speaker-note content
- transition in and transition out
- editing constraints

The `informationShape` and `layoutIntent` are semantic requirements. The visual director resolves the final archetype, geometry, and medium from the layout system.

Every page has an internal audience takeaway, but a visible takeaway callout is default-off. Add one only when it contributes a source-grounded implication not already expressed by the title and working area.

## Deliverable

Return or write one `deck-plan.md` containing:

1. Presentation Contract
2. Evidence Ledger
3. Narrative Strategy and Direction Lock
4. Story Spine and section map
5. Narrative Review
6. Page-by-page Slide Blueprint
7. Content to remove or move into notes
8. Risks, assumptions, missing evidence, and source conflicts

Do not implement HTML, CSS, Markdown slides, PptxGenJS, PowerPoint, or visual assets. Do not propose decoration without a communication purpose. Prefer a shorter coherent deck over a long comprehensive one.
