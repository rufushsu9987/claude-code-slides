# Diagram Design template pack

This bundled skill and its templates are vendored from
[cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design),
source commit `f3622cf66a3c557cb2ead57b687a3c1ff63f5a2b` (2026-08-12).

The upstream skill is MIT-licensed. Its original `LICENSE` and
`THIRD_PARTY_LICENSES.md` are kept in this directory. The pack is exposed as the
portable `diagram-design` skill and is intended to produce standalone diagrams
or SVG/PNG assets for the HTML, Marp, and editable PPTX workflows in this
repository.

When embedding a diagram in a deck, keep the slide title, explanation, source
note, and speaker notes editable outside the diagram asset. Use the selected
deck theme's semantic tokens when the diagram is not being used as a standalone
upstream-styled example.
