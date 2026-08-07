#!/usr/bin/env node

import { chmod, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const mappings = [
  {
    source: 'references/storytelling.md',
    destinations: [
      'skills/create-deck/references/storytelling.md',
      'skills/deck-architect/references/storytelling.md',
    ],
  },
  {
    source: 'references/style-system.md',
    destinations: [
      'skills/create-deck/references/style-system.md',
      'skills/review-deck/references/style-system.md',
      'skills/claude-code-style/references/style-system.md',
      'skills/visual-director/references/style-system.md',
    ],
  },
  {
    source: 'references/output-formats.md',
    destinations: [
      'skills/create-deck/references/output-formats.md',
      'skills/review-deck/references/output-formats.md',
    ],
  },
  {
    source: 'references/review-checklist.md',
    destinations: [
      'skills/review-deck/references/review-checklist.md',
      'skills/deck-reviewer/references/review-checklist.md',
    ],
  },
  {
    source: 'scripts/skill-cli-wrapper.mjs',
    executable: true,
    destinations: [
      'skills/create-deck/scripts/slides-cli.mjs',
      'skills/review-deck/scripts/slides-cli.mjs',
      'skills/deck-reviewer/scripts/slides-cli.mjs',
    ],
  },
];

let failures = 0;

for (const mapping of mappings) {
  const sourcePath = path.join(root, mapping.source);
  const source = await readFile(sourcePath);

  for (const destination of mapping.destinations) {
    const destinationPath = path.join(root, destination);

    if (checkOnly) {
      try {
        const existing = await readFile(destinationPath);
        if (!existing.equals(source)) {
          console.error(`OUT OF SYNC ${destination} (run: npm run sync:skills)`);
          failures += 1;
          continue;
        }

        if (mapping.executable) {
          const mode = (await stat(destinationPath)).mode;
          if ((mode & 0o111) === 0) {
            console.error(`NOT EXECUTABLE ${destination} (run: npm run sync:skills)`);
            failures += 1;
          }
        }
      } catch (error) {
        console.error(`MISSING ${destination}: ${error.message}`);
        failures += 1;
      }
      continue;
    }

    await mkdir(path.dirname(destinationPath), { recursive: true });
    await writeFile(destinationPath, source);
    if (mapping.executable) await chmod(destinationPath, 0o755);
    console.log(`SYNC ${mapping.source} -> ${destination}`);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else if (checkOnly) {
  console.log('Portable skill resources are synchronized.');
}
