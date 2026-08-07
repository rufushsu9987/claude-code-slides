# Changelog

All notable changes to this project are documented here.

## 0.2.1 - 2026-08-07

- Load the plugin directly from the repository marketplace root instead of recursively resolving the same Git repository.
- Add complete marketplace fallback metadata so Codex can display and search for **Claude Code Slides** before installation.
- Document marketplace refresh, inspection, and direct CLI installation commands.

## 0.2.0 - 2026-08-07

- Convert the package to a native Codex plugin with `.codex-plugin/plugin.json`.
- Add a repo marketplace and repo-scoped `.agents/skills` discovery.
- Replace Claude Code command and subagent syntax with Codex `$skill-name` workflows.
- Convert narrative, visual-direction, and review roles into reusable Codex skills.
- Add the `codex-slides` CLI entry point while retaining `claude-slides` as a compatibility alias.
- Update validation, tests, documentation, and environment diagnostics for Codex.

## 0.1.0 - 2026-08-07

- Add initial presentation workflows, templates, validation, example deck, and CI.
