#!/usr/bin/env python3
"""Apply meaningful-cover policy to Claude Code Slides.

This script is intentionally temporary. The bootstrap workflow runs it once,
validates the repository, removes it, and commits the resulting source changes.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    content = target.read_text(encoding="utf-8")
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one replacement, found {count}: {old[:80]!r}")
    target.write_text(content.replace(old, new), encoding="utf-8", newline="\n")


def append_once(path: str, marker: str, addition: str) -> None:
    target = ROOT / path
    content = target.read_text(encoding="utf-8")
    if addition.strip() in content:
        return
    if marker not in content:
        raise RuntimeError(f"{path}: missing append marker")
    target.write_text(content.rstrip() + addition + "\n", encoding="utf-8", newline="\n")


# Canonical layout rules. `npm run sync:skills` propagates this reference.
replace_once(
    "references/layout-system.md",
    "Do not solve repetition by randomly moving boxes. Choose a layout because it matches the communication job of the slide, then vary the geometry only when the meaning changes.\n",
    "Do not solve repetition by randomly moving boxes. Choose a layout because it matches the communication job of the slide, then vary the geometry only when the meaning changes.\n\n"
    "For `editorial-cover`, the right half is **optional**. Empty space is acceptable. If you use the right half, it must earn its place by carrying meaning: a real artifact, a compact proof stack, a direct system cue, or one operational signal. Avoid unlabeled orbit diagrams, abstract circles, and decorative structures that do not improve the audience's understanding within two seconds.\n",
)
replace_once(
    "references/layout-system.md",
    "| `editorial-cover` | Cover or section opening | Large title, one promise, restrained metadata |",
    "| `editorial-cover` | Cover or section opening | Large title, one promise, restrained metadata, and an optional meaningful right-side module |",
)
replace_once(
    "references/layout-system.md",
    "## Selection workflow\n",
    "## Cover execution rules\n\n"
    "Use `editorial-cover` to establish the promise of the talk, not to preview every topic.\n\n"
    "- The right half is **not mandatory**. Prefer whitespace over filler.\n"
    "- If the right half exists, choose exactly **one** meaningful pattern:\n"
    "  - **Artifact-right** — one screenshot, product frame, code crop, or architecture fragment that the talk will revisit.\n"
    "  - **Proof-rail** — two to four evidence chips such as metric, owner, constraint, or date.\n"
    "  - **Signal-stack** — one core signal with a short caption, for example “3 bottlenecks”, “12 services”, or “T+2 handoff”.\n"
    "  - **Direct system cue** — a tiny labeled boundary or flow only when the talk itself is about that system.\n"
    "- Any diagram on the cover must use direct labels and a single takeaway.\n"
    "- Never place a generic hub-and-spoke, concentric-circle, or orbit graphic on the cover unless the cover thesis is specifically about orchestration or boundaries.\n"
    "- If the title is already visually dominant, keep the right module quieter than the left and smaller than one-third of the slide width.\n"
    "- The cover should still read well in thumbnail view and in print.\n\n"
    "## Selection workflow\n",
)

# Cover archetype metadata.
replace_once(
    "templates/layouts.json",
    '      "description": "Large editorial title, one audience promise, and restrained metadata.",',
    '      "description": "Large editorial title, one audience promise, restrained metadata, and an optional meaningful right-side module.",',
)
replace_once(
    "templates/layouts.json",
    '      "variants": ["title-left", "title-bottom", "dark-cover"],',
    '      "variants": ["title-left", "artifact-right", "proof-rail", "signal-stack", "dark-cover"],',
)
replace_once(
    "templates/layouts.json",
    '      "avoid": "Do not add an agenda, feature grid, and long subtitle to the cover.",',
    '      "avoid": "Do not add an agenda, generic orbit diagram, decorative concentric circles, feature grid, or long subtitle to the cover.",',
)

# Creation workflow.
replace_once(
    "skills/create-deck/SKILL.md",
    "Synthesize one concise outline. Every page must have one job, one memorable takeaway, and one layout archetype selected from the bundled layout system. A useful narrative sequence is cover → context → tension → thesis → evidence → execution → risks → decision, but adapt it to the source.\n",
    "Synthesize one concise outline. Every page must have one job, one memorable takeaway, and one layout archetype selected from the bundled layout system. A useful narrative sequence is cover → context → tension → thesis → evidence → execution → risks → decision, but adapt it to the source.\n\n"
    "For every `editorial-cover`, explicitly record `coverRight` as one of `none`, `artifact-right`, `proof-rail`, `signal-stack`, or `direct-system-cue`, plus the source or rationale. Choose `none` when no source-backed artifact, proof, or signal improves the opening.\n",
)
replace_once(
    "skills/create-deck/SKILL.md",
    "Technical-deck rules:\n",
    "Cover rules:\n\n"
    "- Keep the title and audience promise dominant. The right half is optional; whitespace is a valid and often preferable design decision.\n"
    "- If the right half is used, include exactly one meaningful module: a sourced artifact, a compact proof rail, one operational signal, or a tiny direct system cue.\n"
    "- Never invent a generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagram merely to fill space.\n"
    "- A cover visual must be understandable within two seconds, remain secondary to the title, and be readable from the back of the room.\n"
    "- Prefer removing a weak visual over adding decorative complexity.\n\n"
    "Technical-deck rules:\n",
)

# Portable and native visual director guidance.
for path in ["skills/visual-director/SKILL.md", "agents/visual-director.md"]:
    replace_once(
        path,
        "3. Page archetype for every planned slide: communication role, selected archetype, composition, dominant element, supporting elements, and intended eye path.\n4. A layout-diversity audit: unique archetype count, consecutive repeats, visual-family rhythm, card-page share, and planned rhythm changes.\n5. Diagram or data-visualization specifications where relevant.\n6. Required assets and safe fallback treatments.\n7. Accessibility and export risks.\n"
        if path.startswith("skills/")
        else "3. A page archetype for every planned slide: communication role, selected archetype, composition, dominant element, supporting elements, and intended eye path.\n4. A layout-diversity audit: unique archetype count, consecutive repeats, visual-family rhythm, card-page share, and planned rhythm changes.\n5. Diagram or data-visualization specifications where relevant.\n6. Required assets and safe fallback treatments.\n7. Accessibility and export risks.\n",
        "3. Page archetype for every planned slide: communication role, selected archetype, composition, dominant element, supporting elements, and intended eye path.\n4. For each cover or section opener, a `coverRight` decision: `none`, `artifact-right`, `proof-rail`, `signal-stack`, or `direct-system-cue`, with the source and why it earns its place.\n5. A layout-diversity audit: unique archetype count, consecutive repeats, visual-family rhythm, card-page share, and planned rhythm changes.\n6. Diagram or data-visualization specifications where relevant.\n7. Required assets and safe fallback treatments.\n8. Accessibility and export risks.\n"
        if path.startswith("skills/")
        else "3. A page archetype for every planned slide: communication role, selected archetype, composition, dominant element, supporting elements, and intended eye path.\n4. For each cover or section opener, a `coverRight` decision: `none`, `artifact-right`, `proof-rail`, `signal-stack`, or `direct-system-cue`, with the source and why it earns its place.\n5. A layout-diversity audit: unique archetype count, consecutive repeats, visual-family rhythm, card-page share, and planned rhythm changes.\n6. Diagram or data-visualization specifications where relevant.\n7. Required assets and safe fallback treatments.\n8. Accessibility and export risks.\n",
    )
    replace_once(
        path,
        "- Terminal chrome is a supporting motif, not the entire layout.\n",
        "- On covers, default to a title-led composition and whitespace. The right half is optional.\n"
        "- Use a cover's right half only for one sourced artifact, compact proof rail, operational signal, or direct system cue that is understandable within two seconds.\n"
        "- Never invent generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagrams as cover filler. If no meaningful module exists, leave the space empty.\n"
        "- Keep any cover-side module secondary to the title and no wider than roughly one-third of the canvas.\n"
        "- Terminal chrome is a supporting motif, not the entire layout.\n",
    )

# Review and remediation workflow.
replace_once(
    "skills/review-deck/SKILL.md",
    "5. Inspect every page and synthesize findings without repeating automated warnings.\n6. Audit the layout sequence: unique archetypes, consecutive repeats, visual-family repetition, card share, and rhythm changes.\n7. Apply authorized, high-confidence fixes while preserving the user's brand and source of truth.\n8. Re-run validation and preview or generate the deliverable when possible.\n",
    "5. Inspect every page and synthesize findings without repeating automated warnings.\n6. Audit the cover separately: title and promise dominance, whether the right half has a clear information job, source quality, two-second comprehension, and thumbnail readability.\n7. Audit the layout sequence: unique archetypes, consecutive repeats, visual-family repetition, card share, and rhythm changes.\n8. Apply authorized, high-confidence fixes while preserving the user's brand and source of truth.\n9. Re-run validation and preview or generate the deliverable when possible.\n",
)
replace_once(
    "skills/review-deck/SKILL.md",
    "- Is there one dominant element per page?\n- Are alignment, spacing, typography, and color consistent?\n",
    "- Is there one dominant element per page?\n"
    "- Does the cover's right half carry one meaningful artifact, proof, signal, or direct system cue—or remain empty when none exists?\n"
    "- Are generic orbit, hub-and-spoke, concentric-circle, logo-cloud, and micro-label cover diagrams removed unless they directly prove the thesis?\n"
    "- Are alignment, spacing, typography, and color consistent?\n",
)
replace_once(
    "skills/review-deck/SKILL.md",
    "- **Major**: narrative gap, severe density, repetitive layout sequence, accessibility failure, likely overflow, unreliable demo.\n",
    "- **Major**: narrative gap, severe density, repetitive layout sequence, decorative or meaningless cover visual, accessibility failure, likely overflow, unreliable demo.\n",
)

# Independent reviewers.
for path in ["skills/deck-reviewer/SKILL.md", "agents/deck-reviewer.md"]:
    replace_once(
        path,
        "- Narrative: audience promise, thesis, sequence, transitions, close.\n- Content: claim quality, density, evidence, sourcing, assumptions, terminology.\n",
        "- Narrative: audience promise, thesis, sequence, transitions, close.\n"
        "- Cover: title and promise dominance, right-side information value, source quality, two-second comprehension, thumbnail readability, and whether whitespace would be stronger.\n"
        "- Content: claim quality, density, evidence, sourcing, assumptions, terminology.\n",
    )
    marker = (
        "For decks of 10 or more slides, flag fewer than eight distinct archetypes as a Major finding unless the content clearly requires a repeated matched structure. Flag exact consecutive repeats, card-grid or node-card pages above roughly 20%, or more than four slides without a visible rhythm change.\n"
        if path.startswith("skills/")
        else "For decks of 10 or more slides, flag fewer than eight distinct archetypes as Major unless the content clearly requires a repeated matched structure. Flag exact consecutive repeats, excessive card grids, or more than four slides without a visible rhythm change.\n"
    )
    replace_once(
        path,
        marker,
        marker
        + "\nFlag a cover as Major when its right half is occupied by an unsourced generic orbit, hub-and-spoke, concentric-circle, logo-cloud, or micro-label diagram that does not directly prove the title. Recommend whitespace or one sourced artifact, compact proof rail, operational signal, or direct system cue instead.\n",
    )

# Canonical checklist. `npm run sync:skills` propagates it.
replace_once(
    "references/review-checklist.md",
    "## Content\n",
    "## Cover\n\n"
    "- [ ] The title and audience promise are the dominant visual elements.\n"
    "- [ ] The right half is treated as optional and remains empty when no meaningful content improves the opening.\n"
    "- [ ] If present, the right half contains exactly one sourced artifact, compact proof rail, operational signal, or direct system cue.\n"
    "- [ ] Generic orbit, hub-and-spoke, concentric-circle, logo-cloud, and micro-label diagrams are not used as decorative filler.\n"
    "- [ ] The right-side module is secondary to the title and understandable within two seconds.\n"
    "- [ ] The cover remains clear at thumbnail scale, from presentation distance, and in print.\n\n"
    "## Content\n",
)

# Regression test for the policy.
append_once(
    "test/skills.test.mjs",
    "});\n",
    "\n\ntest('cover guidance prefers meaningful evidence or whitespace over decorative right-side filler', async () => {\n"
    "  const [layoutSystem, createDeck, visualDirector, reviewDeck, deckReviewer, reviewChecklist, layoutsText] = await Promise.all([\n"
    "    readFile('references/layout-system.md', 'utf8'),\n"
    "    readFile('skills/create-deck/SKILL.md', 'utf8'),\n"
    "    readFile('skills/visual-director/SKILL.md', 'utf8'),\n"
    "    readFile('skills/review-deck/SKILL.md', 'utf8'),\n"
    "    readFile('skills/deck-reviewer/SKILL.md', 'utf8'),\n"
    "    readFile('references/review-checklist.md', 'utf8'),\n"
    "    readFile('templates/layouts.json', 'utf8'),\n"
    "  ]);\n\n"
    "  assert.match(layoutSystem, /right half is \\*\\*optional\\*\\*/i);\n"
    "  assert.match(layoutSystem, /artifact-right/i);\n"
    "  assert.match(layoutSystem, /generic hub-and-spoke|concentric-circle|orbit graphic/i);\n"
    "  assert.match(createDeck, /coverRight/);\n"
    "  assert.match(createDeck, /leave the space empty|whitespace is a valid/i);\n"
    "  assert.match(visualDirector, /never invent generic orbit/i);\n"
    "  assert.match(reviewDeck, /decorative or meaningless cover visual/i);\n"
    "  assert.match(deckReviewer, /flag a cover as Major/i);\n"
    "  assert.match(reviewChecklist, /decorative filler/i);\n\n"
    "  const layouts = JSON.parse(layoutsText);\n"
    "  const cover = layouts.archetypes.find((layout) => layout.name === 'editorial-cover');\n"
    "  assert.ok(cover);\n"
    "  for (const variant of ['artifact-right', 'proof-rail', 'signal-stack']) {\n"
    "    assert.ok(cover.variants.includes(variant), variant);\n"
    "  }\n"
    "  assert.match(cover.avoid, /orbit|concentric/i);\n"
    "});\n",
)

print("Applied meaningful cover policy.")
