# Deck review checklist

## Plan fidelity

- [ ] A non-trivial deck has a current `deck-plan.md`, or the reviewer has reconstructed an equivalent compact plan.
- [ ] Audience, desired outcome, duration, page budget, audience promise, central thesis, and Direction Lock agree with the request.
- [ ] Every page has one unique role and one internal audience takeaway.
- [ ] The implemented slide order, claims, evidence, and layout intent match the approved plan.
- [ ] Changes to thesis, section order, evidence, or page meaning are reflected in the plan rather than introduced silently during implementation.
- [ ] Visible takeaway callouts are used only when they add an implication not already carried by the title and working area.

## Narrative

- [ ] The opening establishes relevance or tension quickly.
- [ ] Page titles state defensible conclusions rather than categories.
- [ ] The story moves through a coherent spine such as reality, tension, reframe, mechanism, proof, and decision.
- [ ] Every page advances the argument and creates a reason for the next.
- [ ] Same-section slide pairs pass the Narrative Review; there are no unexplained conceptual or evidence jumps.
- [ ] Evidence is close to the claim it supports.
- [ ] The close gives a concrete decision, action, or memorable conclusion.
- [ ] Repeated pages have genuinely different informational jobs.

## Evidence and content integrity

- [ ] Important claims are marked Verified, Derived, Assumption, or Proposal.
- [ ] Numbers have units, dates, definitions, sources, and comparison context.
- [ ] Derived values can be reproduced from verified inputs.
- [ ] Assumptions and proposals are not presented as measured outcomes.
- [ ] Source conflicts and limitations are represented honestly.
- [ ] Jargon is appropriate for the audience.
- [ ] Detail that belongs in notes is not crowding the canvas.
- [ ] Current state, target state, proposal, and measured result are not conflated.
- [ ] Tables, code, and diagrams can be understood at presentation distance.

## Semantic layout fit

- [ ] Every page declares an information shape before its visual form and layout archetype.
- [ ] The selected visual form explains the information faster than bullets or generic cards.
- [ ] Protocol interactions use actors, message order, and labeled request/response arrows rather than a generic architecture diagram.
- [ ] Cross-team handoffs name owners, triggers, approvals, and failure paths.
- [ ] Causal chains are not misrepresented as timelines.
- [ ] Layers change responsibility, policy, or abstraction rather than merely stacking boxes.
- [ ] Trust boundaries name what crosses them and what enforces them.
- [ ] Loops contain feedback that materially changes the next cycle.
- [ ] Screenshots and source artifacts state what they prove.
- [ ] Code or terminal pages pair the decisive lines with a visible result.
- [ ] Column-aligned records are implemented as a native table, not a grid of text boxes.

## Layout diversity

- [ ] Every page has an explicit communication role and matching layout archetype.
- [ ] A deck of 10 or more slides uses at least eight distinct archetypes when the content supports them.
- [ ] The exact archetype is not repeated on consecutive slides.
- [ ] The same visual family does not dominate more than two of any three consecutive slides.
- [ ] Card-grid and node-card pages remain at or below roughly 20% of the deck.
- [ ] Generic split-screen pages remain at or below roughly 35%.
- [ ] The same underlying geometry is not repeated for more than two consecutive pages.
- [ ] A visible rhythm change occurs every three to four slides through scale, density, background, or dominant visual.
- [ ] Editorial claims, evidence, architecture, sequence, risk, and decision pages are interleaved.
- [ ] Repeated layouts represent genuinely repeated semantic tasks, not implementation convenience.
- [ ] The deck reads clearly at thumbnail scale.

## Cover

- [ ] The title and audience promise are the dominant visual elements.
- [ ] The right half is optional and remains empty when no meaningful content improves the opening.
- [ ] If present, the right half contains exactly one sourced artifact, compact proof rail, operational signal, or direct system cue.
- [ ] Generic orbit, hub-and-spoke, concentric-circle, logo-cloud, and micro-label diagrams are not used as decorative filler.
- [ ] The right-side module is secondary to the title and understandable within two seconds.
- [ ] The cover remains clear at thumbnail scale, from presentation distance, and in print.
- [ ] Proof-rail numbers have explicit roles, sources, dates, and one sentence explaining how they relate.
- [ ] Mixed disclosure dates are visible and are not presented as a synchronized snapshot.
- [ ] If the opening thesis is mechanism-led, the next page explains the causal model instead of forcing the proof rail to do both jobs.

## Custom Python SVG

- [ ] Every custom visual has a current `<visual>.visual.md`, `<visual>.py`, and `<visual>.svg` source set.
- [ ] The plan states the audience takeaway, source of truth, semantic model, geometry, eye path, accessibility, editable outside content, and validation contract.
- [ ] Python SVG was chosen because it communicates better than a screenshot, verified chart, native editable shapes, or whitespace.
- [ ] The script compiles, the SVG parses, and regeneration is deterministic for the same inputs.
- [ ] Factual labels, values, dates, units, and boundaries match the source material or are explicitly qualified.
- [ ] The SVG includes accessible metadata, a stable `viewBox`, readable labels, and no external script, absolute local path, or unresolved placeholder.
- [ ] Built-in drawing kinds are treated as examples or fallbacks rather than a mandatory catalog.

## Visual design

- [ ] Palette, type scale, grid, and spacing rhythm are consistent.
- [ ] Each page has one clear visual anchor.
- [ ] Layouts vary with meaning rather than repeating a generic card grid.
- [ ] Accent color communicates importance instead of decorating everything.
- [ ] Alignment and whitespace feel intentional.
- [ ] Diagrams are simpler than the prose they replace.
- [ ] Motion supports orientation and respects reduced-motion settings.

## Accessibility

- [ ] Body text and code are large enough for the room.
- [ ] Contrast remains readable on a projector.
- [ ] Color is not the only carrier of meaning.
- [ ] Images and diagrams have useful alt text or text equivalents.
- [ ] HTML has semantic headings and keyboard navigation.
- [ ] Focus states and controls remain visible.

## Technical quality

- [ ] Local files and asset paths resolve.
- [ ] The deck previews with the documented command.
- [ ] HTML slide position survives refresh, print produces one page per slide, and notes work.
- [ ] HTML slides use meaningful `data-layout` and `data-geometry` markers when supported.
- [ ] HTML flows keep three to six nodes on one row, use exactly one fewer transition label than nodes, and keep connectors clear of copy.
- [ ] Marp frontmatter, separators, theme, layout classes, and export commands are valid.
- [ ] PPTX uses 16:9, generates deterministically, remains editable, records its layout and geometry sequences, and avoids clipped text.
- [ ] Native tables remain native PowerPoint table objects.
- [ ] No placeholder copy, TODO markers, or unresolved template tokens remain.
- [ ] Speaker notes align with page titles and order.
