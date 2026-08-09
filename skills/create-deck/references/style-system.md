# Claude Code-inspired slide design system

This is an independent, unofficial presentation system. It borrows the mood of a warm, focused developer workspace without reproducing Anthropic trademarks, logos, proprietary screenshots, or official brand assets.

## Design principles

1. **Editorial claim first**: every page leads with a decisive message.
2. **Terminal precision**: use monospace labels, commands, status marks, and hairline rules as functional details.
3. **Warm restraint**: neutral canvas, dark ink, one terracotta accent, and generous whitespace.
4. **One focal point**: a page should have a single dominant visual or statement.
5. **Evidence over decoration**: diagrams, numbers, screenshots, code, and quotations must carry meaning.

## Core tokens

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#F7F3EC` | Primary background |
| Surface | `#FFFDF9` | Raised panels and terminal shells |
| Ink | `#211F1B` | Primary text |
| Muted | `#6F6962` | Secondary copy and metadata |
| Border | `#D8D0C6` | Hairlines and quiet structure |
| Accent | `#AD563A` | Key phrase, active state, important number; AA text contrast on the canvas and surface tokens |
| Accent soft | `#F1D9CD` | Low-emphasis accent surface |
| Code | `#27241F` | Terminal or code background |
| Code text | `#F8F3EA` | Terminal text |
| Success | `#5E8065` | Positive status only |
| Warning | `#A56A32` | Risk or caution only |

Use one accent on most slides. Status colors should not become a second decorative palette.

## Typography

Use portable system stacks unless the user supplies licensed fonts.

```css
--font-display: ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, serif;
--font-body: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
```

Recommended scale for a 1920 × 1080 canvas:

| Role | Size | Notes |
| --- | --- | --- |
| Hero | 128–176 px | 0.92–1.0 line height |
| Page headline | 68–92 px | Claim-style, usually 1–2 lines |
| Section label | 22–28 px | Mono, uppercase, tracked |
| Body | 30–40 px | Avoid more than 5 short lines in one block |
| Caption | 20–24 px | Never use for essential information |
| Code | 24–32 px | Show only relevant lines |

Use the display serif for major claims, the sans stack for explanatory text, and monospace for labels, commands, identifiers, and metadata.

## Grid and spacing

- Canvas: 16:9, designed at 1920 × 1080 or PowerPoint wide.
- Safe area: 104–128 px from each edge.
- Use a 12-column grid or a simple 5/7 split.
- Major spacing units: 16, 24, 40, 64, 96, 128.
- Align edges aggressively. Avoid near-alignments.
- Use whitespace before adding borders or containers.

## Page archetypes

### Cover

A small mono eyebrow, one large editorial title, one-sentence promise, and minimal metadata. Do not center everything by default.

### Thesis

One large claim and one supporting proof point. A single number, quotation, or visual can occupy half the page.

### Architecture

Use labeled zones, direct connectors, trust boundaries, and protocols. Keep the flow left-to-right or top-to-bottom. Avoid crossing lines and unlabeled arrows.

### Comparison

Use one shared axis and consistent measurements. Highlight the recommended option with the accent; do not rely on color alone.

### Code or terminal

Show a cropped, purposeful command or code fragment in a dark terminal shell. Use a short prompt mark, clear syntax contrast, and an adjacent takeaway.

### Timeline

Use a strong horizontal or vertical spine with 3–6 milestones. Make the current phase explicit.

### Closing

Repeat the decision or action in a memorable line. Remove generic “Thank you” pages unless contact information is necessary.

## Components

- **Eyebrow**: mono uppercase label, 0.12–0.18em tracking.
- **Prompt mark**: `>` or `$` in the accent color, used sparingly.
- **Hairline**: 1–2 px border in the border token.
- **Status chip**: compact, square-ish, no heavy pill shape.
- **Terminal shell**: 8–12 px radius, dark body, quiet title bar.
- **Metric**: number dominates; label and context remain secondary.
- **Source note**: bottom-aligned, muted, readable, and specific.

## Motion

- Default to subtle entrance and page transitions between 180–420 ms.
- Animate hierarchy in order: label, headline, evidence, annotation.
- Never animate every object independently.
- Respect `prefers-reduced-motion`.
- PPTX should remain fully understandable without animation.

## Data and diagrams

- Start with the question the visual answers.
- Direct-label series and nodes where possible.
- Use consistent scales and truthful baselines.
- Emphasize one comparison or path with the accent.
- Show confidence, assumptions, or source date when the data requires them.
- For architecture, distinguish control plane, data plane, external systems, and trust boundaries.

## Accessibility

- Maintain at least WCAG AA contrast for essential text.
- Do not communicate status by color alone.
- Provide alt text or a text equivalent for meaningful images and diagrams.
- Ensure HTML decks work with keyboard navigation.
- Keep body text and code large enough for a projected room.
- Avoid dense red/green comparisons.

## Avoid

- Copied logos or official Claude/Anthropic brand assets.
- Orange on every object.
- Repeated card grids where whitespace would communicate better.
- Glassmorphism, neon glow, busy gradients, and decorative emoji.
- Generic stock photography.
- Tiny source text, overly long code, and unlabeled diagrams.
- Headlines that only name a topic instead of making a claim.
