# Agent-authored Python SVG protocol

Claude Code Slides is designed to run inside Codex, Claude Code, and other coding agents. Those agents can inspect the source material, design a content-specific visual, write Python, execute it, review the SVG, and revise it. The primary workflow is therefore **plan-backed custom generation**, not selecting from a closed catalog of drawing kinds.

The bundled `scripts/generate-slide-art.py` kinds remain useful as examples, smoke-test fixtures, and fast fallbacks. They are not the limit of what a deck may draw, and an agent should not distort the story merely to fit one of them.

Resolve every bundled `references/...` or `scripts/...` path from the absolute directory containing the active `SKILL.md`. Keep the user's project as the shell working directory; do not change into the installed skill directory before copying a template or running a helper.

## Output contract

For every custom Python-generated visual, keep three source-controlled files together:

```text
slides/<deck>/assets/<visual>.visual.md  # communication and drawing plan
slides/<deck>/assets/<visual>.py         # deterministic generator
slides/<deck>/assets/<visual>.svg        # generated asset used by the deck
```

The Markdown plan is the source of design intent. The Python file is the source of geometry. The SVG is a generated deliverable and should be reproducible from the script.

Do not generate one Python file for the entire deck unless the visuals genuinely share one data model and rendering system. Prefer one small script per meaningful visual so the code, plan, and output remain easy to review.

## Choose the right visual medium

Use a custom Python SVG when the slide needs a content-specific diagram that benefits from precise layout, deterministic rendering, or repeated geometric primitives.

| Need | Preferred medium |
| --- | --- |
| Real product UI, website, terminal output, or source artifact | Screenshot or annotated artifact |
| Quantitative relationship from structured data | Chart generated from the data |
| Simple editable corporate diagram | Native HTML, Marp, or PowerPoint shapes |
| Content-specific mechanism, architecture, journey, boundary, or scene | Agent-authored Python SVG |
| Decorative illustration with no information job | Remove it or use whitespace |

Do not replace a real screenshot, verified chart, or editable two-box flow with a custom SVG merely because Python is available.

## Workflow

### 1. Inspect the source of truth

Read the documents, repository, data, screenshots, and citations that support the slide. Separate verified facts from interpretation. Never invent metrics, product surfaces, customer evidence, protocols, or architecture boundaries to make the visual look complete.

### 2. Write the visual plan before code

Copy the bundled [visual-plan template](python-svg-plan.md) to the deck asset directory and complete it. Substitute the actual absolute skill directory in this command; do not type the placeholder literally:

```bash
cp "<absolute-skill-dir>/references/python-svg-plan.md" \
  slides/<deck>/assets/<visual>.visual.md
```

A useful plan answers:

- What single sentence should the audience understand?
- What evidence or mechanism makes that sentence true?
- Which visual grammar fits: scene, boundary, hub, path, loop, timeline, matrix, annotation, or another named geometry?
- What is the first, second, and final eye target?
- Which labels, values, dates, units, and sources are required?
- What must remain editable outside the SVG?
- How will the result be validated?

The plan should be specific enough that another engineer could review the visual without reading the Python implementation.

### 3. Design the semantic model

Describe real entities and relationships before drawing primitives. For example:

```text
Capital access
  → purchase asset
  → change per-share exposure
  → affect future market access
  → repeat under explicit constraints
```

Only then decide whether those relationships become a loop, path, stack, or boundary. Do not begin with “draw four circles” or “put something on the right side.” Geometry must follow meaning.

### 4. Write a dedicated Python generator

Prefer the Python standard library for portable diagrams. Additional libraries are acceptable only when they already exist in the project or materially improve a data visualization.

The script should normally:

- accept `--output`
- use a deterministic seed when rough or hand-drawn treatment is requested
- emit a stable `viewBox`, normally `0 0 1200 700`
- escape all user- or source-derived text
- include `<title>` and `<desc>` metadata
- set `role="img"` and connect accessible labels
- avoid external fonts, network calls, JavaScript, `foreignObject`, and local absolute paths
- create parent directories and write UTF-8 with stable newlines
- fail clearly when required inputs are missing

Recommended CLI shape:

```bash
python3 slides/<deck>/assets/<visual>.py \
  --output slides/<deck>/assets/<visual>.svg \
  --style clean \
  --seed 42
```

### 5. Keep slide chrome outside the SVG

The SVG should carry the visual model, not flatten the whole slide. Keep these elements editable in HTML, Marp, or PPTX whenever possible:

- slide title and section label
- explanatory copy
- source and disclosure note
- page number and footer
- speaker notes
- navigation and interaction controls

Diagram labels that are spatially coupled to nodes or paths may live inside the SVG. Long explanations, citations, and caveats usually should not.

### 6. Generate, inspect, and revise

Run the script and inspect the actual SVG at slide size and thumbnail size. Revise the plan when the visual model changes; do not let the Markdown plan become stale documentation.

Minimum validation:

```bash
python3 -m py_compile slides/<deck>/assets/<visual>.py
python3 slides/<deck>/assets/<visual>.py \
  --output slides/<deck>/assets/<visual>.svg

python3 - <<'PY'
from pathlib import Path
from xml.etree import ElementTree as ET

path = Path("slides/<deck>/assets/<visual>.svg")
root = ET.parse(path).getroot()
assert root.tag.endswith("svg")
assert root.attrib.get("viewBox")
assert path.stat().st_size > 0
print(f"validated {path}")
PY
```

Then run the deck validator and preview or render the target format.

## Visual-plan template

Each `<visual>.visual.md` should contain at least the following sections.

```markdown
---
id: capital-engine
slide: 02
role: mechanism
archetype: operating-loop
geometry: custom-loop
style: clean
canvas: 1200x700
script: assets/capital-engine.py
output: assets/capital-engine.svg
---

# Audience takeaway

One sentence the audience should remember.

# Source of truth

- Verified fact, data field, document, screenshot, or repository path
- Assumptions that must be labeled

# Semantic model

Entities, states, boundaries, transitions, and feedback relationships.

# Composition and eye path

First target → second target → final implication.

# Elements

| Element | Meaning | Label/value | Visual treatment |
| --- | --- | --- | --- |

# Editable outside the SVG

Title, explanation, source note, or other slide-level content.

# Accessibility

Accessible title, description, reading order, and non-color cues.

# Constraints

Projection distance, maximum labels, required dimensions, and prohibited filler.

# Validation

Commands and visual checks required before delivery.
```

## Python skeleton

Use this as a starting point, not as a mandatory renderer:

```python
#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
from pathlib import Path
from xml.etree import ElementTree as ET

WIDTH = 1200
HEIGHT = 700


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def build_svg(title: str, description: str) -> str:
    body = """
    <!-- Draw only the content-specific visual model here. -->
    """
    return f'''<svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 {WIDTH} {HEIGHT}" role="img"
      aria-labelledby="title desc">
      <title id="title">{esc(title)}</title>
      <desc id="desc">{esc(description)}</desc>
      {body}
    </svg>'''


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        build_svg("Visual title", "What the diagram communicates."),
        encoding="utf-8",
        newline="\n",
    )
    ET.parse(output)
    print(f"Wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

## Composition rules

- One dominant visual model per SVG.
- Use direct labels; arrows should name data, identity, protocol, ownership, decision, or state change when ambiguity exists.
- Keep node and label counts low enough for presentation distance.
- Use color as emphasis, not as the only carrier of meaning.
- Prefer meaningful asymmetry and whitespace over evenly distributed filler.
- A loop is valid only when feedback materially changes the next cycle.
- A boundary is valid only when the plan names what crosses it and what enforces it.
- A hub is valid only when the connections explain access, data, responsibility, or control.
- A scene is valid only when the human, agent, or system interaction advances the argument.

## Cover policy

Custom Python SVG is usually more valuable on an explanatory page than on the cover. Keep the cover title-led. Use a cover-side SVG only when it communicates the opening thesis within two seconds, remains secondary to the title, and is backed by the visual plan. Otherwise use whitespace, a sourced artifact, or a compact proof rail, then place the custom mechanism or architecture visual on the next page.

## Built-in renderer as a pattern library

The bundled `scripts/generate-slide-art.py` provides tested examples of deterministic strokes, accessible SVG metadata, arrows, labels, paths, loops, boundaries, and scenes. Resolve it to an absolute path from the skill directory while keeping the user's workspace as the current directory:

```bash
python3 "<absolute-skill-dir>/scripts/generate-slide-art.py" --list-kinds
python3 "<absolute-skill-dir>/scripts/generate-slide-art.py" \
  --kind architecture-boundary \
  --output slides/<deck>/assets/architecture-boundary.svg
```

Agents may:

- use a built-in kind when it already matches the communication job
- inspect the implementation for reusable techniques
- copy and adapt a small primitive into the deck-local generator
- create a completely new composition when the content requires it

Do not add a permanent global `--kind` for every one-off deck visual. Promote a custom pattern into the shared generator only after it proves reusable across multiple unrelated decks.

## Review checklist

A custom SVG is ready when:

- the `.visual.md`, `.py`, and `.svg` agree
- the visual proves or explains the slide headline
- every factual label is sourced or explicitly qualified
- the geometry expresses the semantic model rather than filling space
- text is readable at presentation distance
- the SVG remains understandable in grayscale and thumbnail view
- `<title>`, `<desc>`, `role="img"`, and a stable `viewBox` are present
- the output contains no script, external dependency, absolute local path, unresolved placeholder, or hidden overflow
- regenerating the SVG produces the same result for the same inputs
- the deck still passes its format-specific validator and export check
