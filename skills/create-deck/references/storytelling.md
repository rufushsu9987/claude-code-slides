# Presentation storytelling and slide-planning system

A strong deck is planned as an argument before it is implemented as pages. The plan is a compact design contract, not a transcript of hidden reasoning: it records the decisions that the architect, visual director, builder, and reviewer need in order to produce the same story.

For every non-trivial deck, create a deck-local `deck-plan.md` before writing slide markup or generation code. The plan is the source of truth for the presentation's audience, thesis, evidence, sequence, and page intent. A builder may improve fit, alignment, and visual execution, but must not silently change the argument.

## 1. Communication contract

Lock these fields before planning pages:

- **Audience** — role, context, and current knowledge.
- **Desired outcome** — the decision, belief, or action the deck should create.
- **Duration and page budget** — explicit request or a defensible estimate.
- **Audience promise** — complete: “After this presentation, the audience will understand ___ and be ready to ___ because ___.”
- **Central thesis** — one sentence with a subject, claim, and consequence.
- **Direction Lock** — one sentence that fixes the chosen angle and prevents the deck from drifting.
- **Strongest evidence** — the source-backed proof that carries the thesis.
- **Weakest assumption** — the claim most likely to need qualification or removal.
- **Constraints** — language, format, brand, confidentiality, accessibility, and delivery context.

A weak thesis names a topic:

> An overview of our AI platform.

A stronger thesis makes a defensible claim:

> A governed internal AI platform lets product teams ship faster without rebuilding security, data, and model infrastructure in every project.

Ask only when a missing constraint materially changes the story. Otherwise state the assumption and continue.

## 2. Narrative forks when direction is genuinely ambiguous

Do not write multiple full decks. When the request explicitly asks to explore, or two plausible angles would create materially different presentations, compare exactly three concise narrative forks:

1. thesis and audience outcome
2. best-fit audience or use case
3. high-level story flow
4. strongest available evidence
5. main trade-off or risk

Choose one fork, or combine them into one Direction Lock, before writing the page sequence. If the task is already clear, skip this step.

## 3. Evidence model

Classify important claims in the plan:

- **Verified** — directly supported by a provided source or reliable citation.
- **Derived** — a transparent calculation or inference from verified facts.
- **Assumption** — needed for planning but not established as fact.
- **Proposal** — a recommendation or future-state design.

Never present an assumption or proposal as a measured result. Record source conflicts, authority, dates, and units in the plan; do not hide them inside a visual.

For source-heavy work, keep a compact evidence ledger:

| Claim | Status | Source | What it proves | Limitation |
| --- | --- | --- | --- | --- |
| Example claim | Verified | `report.md §4` | Establishes the current bottleneck | Data ends in Q2 |

Evidence should sit close to the claim it supports. A screenshot is evidence only when the page says what it proves.

## 4. Story spine

A useful default movement is:

```text
Reality → Tension → Reframe → Mechanism → Proof → Decision
```

This is a planning lens, not a mandatory agenda. Technical, research, incident, training, and sales decks may use different beats, but the sequence still needs cause and consequence.

Use a compact Why / How / What check:

- **Why** — why the audience should care now.
- **How** — the mechanism, system, or reasoning that changes the situation.
- **What** — the decision, implementation, or next action.

Do not force these words onto visible section dividers. Use them to detect a deck that has details but no reason, a proposal but no mechanism, or evidence but no decision.

## 5. Section continuity

Pages inside a section should behave like consecutive narrative beats, not independent documents that share a topic.

For every adjacent pair, check:

- What premise or question does the first page leave open?
- Does the next page answer or advance it?
- Is a conclusion shown before its support?
- Does the story jump from symptom to solution without a root cause or mechanism?
- Is the same point repeated with different nouns?
- Would a merge, cut, reorder, or stronger claim title fix the gap?

Prefer the least disruptive fix. Do not add artificial host-style transition text merely to connect weak pages.

Record a compact **Narrative Review** in `deck-plan.md`:

```text
Status: Pass
```

or, only for unresolved gaps:

```text
Slides 05 → 06
Gap: the gateway appears before the authentication failure is established.
Adjustment: keep the order, but make Slide 05's title name the failure mode.
```

## 6. Per-slide blueprint

Every page has one unique informational job. If two pages make the same point, merge or remove one.

For each page, record:

- `id` and `section`
- `role` — opening, context, tension, mechanism, evidence, comparison, sequence, risk, decision, close, or another explicit role
- `purpose` — why the page exists
- `claimTitle` — a conclusion, not a topic label
- `supportingSentence` — optional scope, mechanism, or factual context
- `audienceTakeaway` — the internal sentence the audience should remember
- `evidenceStatus` — Verified, Derived, Assumption, or Proposal
- `evidence` and `sourceAssets`
- `informationShape` — point, number, trend, categories, contrast, sequence, causal chain, hierarchy, topology, boundary, decision, risk, table, artifact, code, or another precise shape
- `visualForm` — chart, protocol sequence, matched comparison, annotated screenshot, native table, architecture boundary, code/result pair, and so on
- `layoutIntent` — what should dominate and how the eye should move; the visual director resolves the final archetype and geometry
- `density` — low, medium, or high
- `content` — visible facts, labels, steps, or rows
- `speakerNotes` — nuance, caveats, transitions, and secondary evidence
- `transitionIn` and `transitionOut`
- `editingConstraints` — facts, ordering, or visual semantics that must not change

Omit fields that do not apply rather than filling the plan with generic prose.

Example:

```markdown
## Slide 07 — Device Flow removes long-lived secrets from client config

- Role: Mechanism / protocol
- Purpose: Explain exactly how authentication leaves the client disk.
- Audience takeaway: The client receives tokens without storing a static secret.
- Evidence status: Verified
- Evidence: `auth-design.md`, “Device Flow”
- Information shape: Protocol interaction
- Visual form: Three-actor numbered sequence with request/response arrows
- Layout intent: Diagram dominates; title and one source note remain editable
- Density: Medium
- Transition in: The previous page establishes the plaintext-token failure mode.
- Transition out: The next page shows the operational guardrails around issued tokens.
```

## 7. Titles communicate points

Prefer claim-style titles:

- “Teams rebuild the same controls in every AI project.”
- “A shared platform turns governance into a paved road.”
- “Token 明碼留在 Client 端，才是 MCP 無法規模化的真正阻力。”

Avoid labels that make the audience interpret the page:

- “Challenges”
- “Architecture”
- “Benefits”

A title must remain defensible. Do not manufacture drama or unsupported numbers. Use a short supporting sentence only when it adds scope, mechanism, or evidence instead of repeating the title.

Every page has an internal `audienceTakeaway`, but a visible takeaway callout is **default-off**. Add one only when it states a source-grounded implication not already carried by the title and working area. Do not reserve an empty bottom strip on every page.

## 8. Density and notes

Use the canvas for what must be seen and speaker notes for what must be said.

- Cover: one strong title, one promise, restrained context.
- Tension or thesis: one sentence or one number.
- Content: one dominant visual and only the labels needed to read it.
- Comparison: matched criteria on a shared axis.
- Architecture: real layers, boundaries, ownership, and labeled flows.
- Dense reference page: intentional, projection-safe, and preferably available as an appendix.

Do not shrink type to rescue an overloaded page. Split the idea, simplify the wording, or move detail into notes.

## 9. Plan and sample review

For an interactive or high-stakes workflow, review the plan before full implementation and then render a small style sample: the cover plus one representative content page. This catches narrative drift and visual mismatch before the entire deck is built.

For a one-shot workflow, do not create unnecessary hard pauses. Run the same plan audit and sample self-review internally, record unresolved assumptions, and continue to the complete deliverable.

A plan must be revisited when the thesis changes, a major section is added or removed, pages are reordered, or evidence invalidates a claim. Fit, spacing, and wording adjustments that preserve meaning do not require a narrative rebuild.
