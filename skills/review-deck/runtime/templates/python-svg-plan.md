---
id: replace-with-visual-id
slide: replace-with-slide-number
role: evidence | mechanism | system | sequence | comparison | decision
archetype: replace-with-layout-archetype
geometry: replace-with-meaningful-geometry-name
style: clean | sketch
canvas: 1200x700
script: assets/replace-with-visual-id.py
output: assets/replace-with-visual-id.svg
---

# Audience takeaway

Write the one sentence the audience should understand after seeing this visual.

# Source of truth

- Source file, URL, repository path, dataset, or verified claim:
- Required values, units, dates, and definitions:
- Assumptions or interpretations that must be labeled:
- Content that must not be fabricated:

# Why Python SVG

Explain why a custom vector visual is more suitable than a screenshot, chart, native editable shapes, or whitespace.

# Semantic model

Describe entities, states, actors, boundaries, transitions, inputs, outputs, ownership, and feedback before describing shapes.

```text
entity or state
  → named transition
  → entity or state
```

# Composition and eye path

- First visual target:
- Second visual target:
- Final implication or decision:
- Dominant element:
- Density: low | medium | high
- Intended thumbnail silhouette:

# Elements

| ID | Meaning | Label or value | Source | Visual treatment | Position or relationship |
| --- | --- | --- | --- | --- | --- |
| 01 |  |  |  |  |  |

# Connections

| From | To | Meaning | Label | Direction or feedback |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

# Editable outside the SVG

List slide-level content that must remain editable in HTML, Marp, or PPTX:

- title and eyebrow
- explanatory copy
- source or disclosure note
- footer and page number
- speaker notes

# Visual tokens

- Canvas/background:
- Ink:
- Muted text:
- Accent:
- Surface:
- Border:
- Typography fallback:
- Line treatment:

# Accessibility

- Accessible `<title>`:
- Accessible `<desc>`:
- Reading order:
- Non-color cues:
- Minimum projected label size:

# Constraints

- Maximum nodes or major elements:
- Maximum visible labels:
- Required `viewBox`:
- Transparent or opaque background:
- Prohibited filler or misleading geometry:
- Export limitations:

# Python contract

- CLI arguments:
- Deterministic seed requirement:
- Allowed dependencies:
- Output path:
- Failure conditions:

# Validation

```bash
python3 -m py_compile assets/replace-with-visual-id.py
python3 assets/replace-with-visual-id.py \
  --output assets/replace-with-visual-id.svg
```

Visual checks:

- [ ] The SVG proves or explains the slide headline.
- [ ] All factual labels match the source of truth.
- [ ] The visual remains readable at thumbnail and presentation distance.
- [ ] The `.visual.md`, `.py`, and `.svg` agree.
- [ ] The output contains `<title>`, `<desc>`, `role="img"`, and a stable `viewBox`.
- [ ] No external script, network dependency, absolute local path, or unresolved placeholder exists.
- [ ] Regeneration is deterministic for the same inputs.
- [ ] The target deck passes its normal validation and export checks.
