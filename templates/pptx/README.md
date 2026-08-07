# {{TITLE}}

An editable 16:9 PowerPoint deck generated with PptxGenJS.

## Build

```bash
npm install
npm run build
```

The presentation is written to `dist/{{OUTPUT_FILE}}`.

## Validate source

```bash
claude-slides check .
```

## Edit

- Shared palette, typography, title, footer, and layout helpers are near the top of `deck.mjs`.
- Use editable text, shapes, charts, and tables whenever possible.
- Add talk tracks with `slide.addNotes('...')`.
- Keep fonts portable or document the required font installation.

## Compatibility

Open the generated file in Microsoft PowerPoint when available. Also test import in Keynote, LibreOffice Impress, or Google Slides when cross-platform delivery matters.
