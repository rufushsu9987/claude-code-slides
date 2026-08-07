# Template gallery

Claude Code Slides ships seven professional presets. Every preset supports HTML, Marp, and editable PPTX output.

## List templates

```bash
codex-slides templates
codex-slides templates --format pptx --json
```

The same commands are available through `claude-slides`.

## Create a deck with a preset

```bash
codex-slides init "Cloud Platform Review" \
  --format pptx \
  --template cloud-architecture
```

Every generated deck includes `template.json`, which records the selected preset and its design tokens.

## Presets

| Template | Visual direction | Recommended use |
| --- | --- | --- |
| `terminal-editorial` | Warm ivory, charcoal, terracotta, editorial typography | Technical talks, architecture reviews, AI and developer tooling |
| `executive-brief` | Clean navy, cobalt emphasis, compact business hierarchy | Leadership updates, strategy proposals, quarterly reviews |
| `cloud-architecture` | Blueprint grid, cyan and navy, precise boundaries | Cloud platforms, infrastructure, security and architecture |
| `data-story` | Calm green editorial system focused on evidence | Analytics, research, metrics and comparison narratives |
| `product-launch` | High-contrast violet with spotlight geometry | Product launches, demos, roadmaps and feature stories |
| `dark-terminal` | Dark developer workspace with warm code accents | Live demos, code walkthroughs and engineering deep dives |
| `incident-review` | Structured red and neutral signal system | Postmortems, incident timelines, root cause and remediation |

## Selection guidance

Use the audience and desired decision rather than personal preference:

- Executives need low-density claims and an explicit decision: `executive-brief`.
- Architecture audiences need boundaries, protocols, ownership and flows: `cloud-architecture`.
- Data-heavy stories need one comparison or metric per page: `data-story`.
- Product narratives need momentum, benefits and demo moments: `product-launch`.
- Code-heavy sessions need projection-safe dark surfaces: `dark-terminal`.
- Postmortems need chronology, impact, cause and accountable actions: `incident-review`.
- General technical storytelling remains strongest with `terminal-editorial`.

A supplied company brand or existing template should override these presets.

## Adding another preset

Add an entry to `templates/catalog.json` with:

- kebab-case `name`
- display name and description
- supported formats
- light or dark mode
- a supported background pattern
- complete palette, font and shape tokens

Then run:

```bash
npm run check
```

The smoke test scaffolds every preset in HTML, Marp and PPTX to prevent a catalog entry from shipping without working output.
