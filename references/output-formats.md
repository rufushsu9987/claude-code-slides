# Output format guidance

## HTML

Choose HTML for live delivery, strong visual fidelity, interactive demos, responsive scaling, offline playback, browser sharing, or unspecified output.

Minimum requirements:

- Self-contained directory with local assets and no required runtime CDN.
- Fixed 16:9 design canvas that scales to the viewport.
- Arrow, Page Up/Down, Home/End, Space, click, and touch navigation.
- URL hash or equivalent page state.
- Speaker notes available without a network request.
- Print CSS that produces one slide per page.
- `prefers-reduced-motion` support.
- Semantic headings, useful alt text, document language, and keyboard operability.

## Marp

Choose Marp for Markdown review, Git-friendly collaboration, fast PDF generation, or documentation-style decks.

Minimum requirements:

- YAML frontmatter with `marp: true`, `size: 16:9`, theme, and pagination policy.
- Custom theme CSS stored next to the deck.
- Clear slide separators outside code blocks.
- Local asset paths and useful image alt text.
- Export commands documented in `README.md`.
- No layout that depends on browser-only JavaScript.

Typical exports:

```bash
npx @marp-team/marp-cli@latest deck.md --theme theme.css --html
npx @marp-team/marp-cli@latest deck.md --theme theme.css --pdf
npx @marp-team/marp-cli@latest deck.md --theme theme.css --pptx
```

## PPTX with PptxGenJS

Choose PPTX for editable Office delivery, corporate handoff, or when PowerPoint compatibility is required.

Minimum requirements:

- PptxGenJS `4.0.1` or a user-approved later version.
- `LAYOUT_WIDE` and a consistent 16:9 coordinate system.
- Portable fonts or documented font requirements.
- Shared helpers for page chrome, titles, notes, and sources.
- Editable shapes and text rather than a flattened screenshot of the full page.
- Output directory creation and deterministic file naming.
- Safe `pptx.ShapeType` values and no undocumented OOXML manipulation.
- `slide.addNotes()` where a talk track is required.
- A generated `.pptx` when dependency installation and execution are permitted.

Recommended verification:

- Open in Microsoft PowerPoint when available.
- Also test import in Keynote, LibreOffice Impress, or Google Slides when portability matters.
- Inspect overflow, clipped glyphs, broken links, missing fonts, and editability.
