# Changelog

All notable changes to this project are documented here.

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
- Add a repo marketplace and repo-scoped `.agents/skills` discovery.
- Replace Claude Code command and subagent syntax with Codex `$skill-name` workflows.
- Convert narrative, visual-direction, and review roles into reusable Codex skills.
- Add the `codex-slides` CLI entry point while retaining `claude-slides` as a compatibility alias.
- Update validation, tests, documentation, and environment diagnostics for Codex.

## 0.1.0 - 2026-08-07

- Add initial presentation workflows, templates, validation, example deck, and CI.
