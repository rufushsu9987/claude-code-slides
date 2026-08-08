# Changelog

All notable changes to this project are documented here.

## Unreleased

- Keep `claude-code-slides` focused on presentation creation; video rendering, narration, and media packaging remain outside this repository.
- Add `infographic-story`, `data-journey`, and `decision-path` layout archetypes with HTML, Marp, and editable PPTX starters.
- Add a dependency-free Python SVG generator for reusable infographic, trend, and decision-path assets.
- Add deterministic generator tests, portable asset fixtures, and documentation for Python-assisted slide graphics.

## 0.6.0 - 2026-08-08

- Rename the default visual preset to `claude-editorial` while preserving `terminal-editorial` as a backward-compatible alias.
- Add a catalog of 16 semantic layout archetypes and deterministic layout-diversity rules.
- Expand the HTML, Marp, and editable PPTX starters from five repeated structures to twelve distinct page compositions.
- Add `codex-slides layouts` and `claude-slides layouts` discovery commands.
- Record the layout system, rules, starter sequence, and archetype list in every generated `template.json`.
- Add explicit layout markers for HTML (`data-layout`), Marp slide classes, and PPTX (`LAYOUT_SEQUENCE`).
- Update create, visual-direction, review, and audit skills to select layouts by communication role and detect repetition.
- Add tests for template aliases, 16-layout catalog integrity, 12-layout starter diversity, card-share constraints, and synchronized portable resources.

## 0.5.0 - 2026-08-08

- Add a catalog of seven professional templates across HTML, Marp, and editable PPTX.
- Add `codex-slides templates` and `claude-slides templates` discovery commands.
- Add `--template <name>` to the deck scaffolding workflow.
- Generate `template.json` in every deck for reproducible palette, typography, pattern, and format metadata.
- Apply template-specific CSS overlays to HTML and Marp and deterministic palette/font replacement to PptxGenJS.
- Extend the portable `create-deck` skill with audience-based template selection guidance.
- Expand smoke tests to scaffold every template in every supported format.
- Add template catalog validation, documentation, and regression tests.

## 0.4.0 - 2026-08-07

- Add the root Agent Plugins 1.0.0 `plugin.json` portable manifest.
- Package all seven workflows as fixed-location portable Agent Skills.
- Move runtime references and helper scripts behind skill-relative `references/` and `scripts/` paths.
- Add deterministic synchronization for generated skill-local resources.
- Preserve native Codex and Claude Code manifests, marketplaces, commands, and subagents.
- Extend CI to validate Agent Plugins conformance, portable resource boundaries, synchronization, and cross-platform version alignment.
- Document usage for Agent Plugins-compatible clients, Codex, and Claude Code.

## 0.3.0 - 2026-08-07

- Add native Claude Code plugin and marketplace manifests alongside Codex.
- Restore Claude Code namespaced skills and three presentation subagents.
- Keep one shared `skills/` workflow source for both platforms.
- Add dual-platform version, manifest, marketplace, and agent validation.
- Update CLI diagnostics to detect both `codex` and `claude`.
- Document installation, updates, local development, and troubleshooting for both hosts.

## 0.2.1 - 2026-08-07

- Fix Codex marketplace discovery by loading the plugin from the downloaded marketplace root.
- Add searchable fallback metadata for Codex plugin listings.
- Document marketplace refresh and stale snapshot recovery.

## 0.2.0 - 2026-08-07

- Convert the package to a native Codex plugin with `.codex-plugin/plugin.json`.
- Add a repository marketplace and repository-scoped `.agents/skills` discovery.
- Add the `codex-slides` CLI entry point while retaining `claude-slides` as a compatibility alias.

## 0.1.0 - 2026-08-07

- Add initial presentation workflows, templates, validation, example deck, and CI.
