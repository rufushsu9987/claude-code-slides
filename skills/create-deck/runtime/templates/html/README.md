# {{TITLE_MARKDOWN}}

A self-contained 16:9 HTML presentation using **{{TEMPLATE_NAME_MARKDOWN}}** (`{{TEMPLATE_ID_MARKDOWN_CODE}}`).

Language: `{{LANGUAGE_MARKDOWN_CODE}}`.

The generated `template.json` records the selected palette, typography, visual pattern, and output format.

## Preview

Open `index.html` directly, or serve the directory locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Controls

- `←` / `→`, `↑` / `↓`, Page Up / Page Down, or Space: navigate
- Click left or right side, or swipe: navigate
- `Home` / `End`: first or last slide
- `F`: fullscreen
- `N`: speaker notes
- `P`: print or export to PDF

## Validate

```bash
codex-slides check .
# or
claude-slides check .
```

## Edit

- Slides are `<section class="slide">` elements in `index.html`.
- Put the talk track in an `<aside class="notes">` inside each slide.
- Visual tokens, the base system, and the selected preset live in `theme.css`.
- Navigation and 1920 × 1080 viewport scaling live in `slides.js`.
- Keep images and diagrams local to this directory.
