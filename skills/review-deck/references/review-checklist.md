# Deck review checklist

## Narrative

- [ ] Audience and desired decision are clear.
- [ ] The deck has a one-sentence thesis.
- [ ] The opening creates relevance or tension quickly.
- [ ] Page titles state takeaways rather than categories.
- [ ] Every page advances the argument and creates a reason for the next.
- [ ] The close gives a concrete decision, action, or memorable conclusion.

## Cover

- [ ] The title and audience promise are the dominant visual elements.
- [ ] The right half is treated as optional and remains empty when no meaningful content improves the opening.
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

## Content

- [ ] One dominant idea per page.
- [ ] Numbers have units, dates, and comparison context.
- [ ] Claims are sourced, derived transparently, or explicitly qualified.
- [ ] Jargon is appropriate for the audience.
- [ ] Detail that belongs in notes is not crowding the canvas.
- [ ] Tables, code, and diagrams can be understood at presentation distance.
- [ ] Current state, target state, proposal, and measured result are not conflated.

## Layout diversity

- [ ] Every page has an explicit communication role and a matching layout archetype.
- [ ] A deck of 10 or more slides uses at least eight distinct archetypes when the content supports them.
- [ ] The exact layout archetype is not repeated on consecutive slides.
- [ ] The same visual family does not dominate more than two of any three consecutive slides.
- [ ] Card-grid and node-card pages remain at or below roughly 20% of the deck.
- [ ] A visible rhythm change occurs every three to four slides through scale, density, background, or dominant visual.
- [ ] Editorial claims, evidence, architecture, sequence, risk, and decision pages are interleaved rather than grouped into repetitive blocks.
- [ ] Repeated layouts represent genuinely repeated semantic tasks, not convenience.

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
- [ ] HTML slides use meaningful `data-layout` markers when the workflow supports them.
- [ ] Marp frontmatter, separators, theme, layout classes, and export commands are valid.
- [ ] PPTX uses 16:9, generates deterministically, remains editable, records its layout sequence, and avoids clipped text.
- [ ] No placeholder copy, TODO markers, or unresolved template tokens remain.
- [ ] Speaker notes align with page titles and order.
