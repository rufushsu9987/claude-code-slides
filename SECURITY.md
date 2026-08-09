# Security policy

Codex and Claude Code plugins are trusted code. Review this repository before installation and install only from the canonical source.

The bundled CLI and helper scripts do not require API keys, hooks, background services, telemetry, or network requests. They use standard-library modules and operate on the deck paths selected by the user. An agent workflow may still read a user-authorized URL, and generated Marp or PptxGenJS projects may install their documented third-party toolchain when the user chooses to export those formats; those actions use the host's normal permission and network controls.

Report security concerns privately through GitHub's security advisory feature for this repository. Do not include secrets, private decks, or confidential source files in public issues.

Published `claude-code-slides--vX.Y.Z` releases are the stable channel and include a SHA-256 checksum file. The `main` branch is a preview channel. Security fixes are applied to the newest release; use a previous immutable tag when rollback is required.
