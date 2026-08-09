# {{TITLE_MARKDOWN}}

A Git-friendly Marp presentation using **{{TEMPLATE_NAME_MARKDOWN}}** (`{{TEMPLATE_ID_MARKDOWN_CODE}}`).

Language: `{{LANGUAGE_MARKDOWN_CODE}}`.

The generated `template.json` records the selected palette, typography, visual pattern, and output format.

## Preview

```bash
npx @marp-team/marp-cli@latest deck.md --theme theme.css --html
```

## Export

```bash
npx @marp-team/marp-cli@latest deck.md --theme theme.css --pdf
npx @marp-team/marp-cli@latest deck.md --theme theme.css --pptx
```

## Validate

```bash
codex-slides check .
# or
claude-slides check .
```

Keep assets local to this directory and use meaningful Markdown image alt text.
