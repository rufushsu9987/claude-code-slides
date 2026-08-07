# Security policy

Claude Code plugins are trusted code. Review this repository before installation and install only from the canonical source.

This plugin does not require API keys, hooks, background services, telemetry, or network access. The root `claude-slides` CLI uses Node.js standard-library modules and reads or writes only the deck paths selected by the user. Generated Marp or PptxGenJS projects may install their documented third-party toolchain when the user chooses to export those formats.

Report security concerns privately through GitHub's security advisory feature for this repository. Do not include secrets, private decks, or confidential source files in public issues.
