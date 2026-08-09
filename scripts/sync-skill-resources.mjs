#!/usr/bin/env node

import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const fileMode = 0o644;
const executableMode = 0o755;
const skillNames = [
  'claude-code-style',
  'create-deck',
  'deck-architect',
  'deck-reviewer',
  'review-deck',
  'speaker-notes',
  'visual-director',
];
const cliSkillNames = ['create-deck', 'review-deck', 'deck-reviewer'];

const mappings = [
  {
    source: 'references/python-svg-plan.md',
    destinations: ['templates/python-svg-plan.md'],
  },
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
    source: 'references/visual-quality.md',
    destinations: [
      'skills/create-deck/references/visual-quality.md',
      'skills/review-deck/references/visual-quality.md',
      'skills/visual-director/references/visual-quality.md',
      'skills/deck-reviewer/references/visual-quality.md',
    ],
  },
  {
    source: 'references/layout-system.md',
    destinations: [
      'skills/create-deck/references/layout-system.md',
      'skills/review-deck/references/layout-system.md',
      'skills/visual-director/references/layout-system.md',
      'skills/deck-reviewer/references/layout-system.md',
    ],
  },
  {
    source: 'references/python-svg-authoring.md',
    destinations: [
      'skills/create-deck/references/python-svg-authoring.md',
      'skills/review-deck/references/python-svg-authoring.md',
      'skills/visual-director/references/python-svg-authoring.md',
      'skills/deck-reviewer/references/python-svg-authoring.md',
    ],
  },
  {
    source: 'references/python-svg-plan.md',
    destinations: [
      'skills/create-deck/references/python-svg-plan.md',
      'skills/review-deck/references/python-svg-plan.md',
      'skills/visual-director/references/python-svg-plan.md',
      'skills/deck-reviewer/references/python-svg-plan.md',
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
    mode: executableMode,
    destinations: cliSkillNames.map((name) => `skills/${name}/scripts/slides-cli.mjs`),
  },
  {
    source: 'scripts/generate-slide-art.py',
    mode: executableMode,
    destinations: [
      'skills/create-deck/scripts/generate-slide-art.py',
      'skills/review-deck/scripts/generate-slide-art.py',
      'skills/visual-director/scripts/generate-slide-art.py',
      'skills/deck-reviewer/scripts/generate-slide-art.py',
    ],
  },
];

async function sourceTreeFiles(relativeRoot) {
  const files = [];

  async function visit(relativeDirectory) {
    const entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        await visit(relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      } else {
        throw new Error(`Canonical runtime source must be a regular file: ${relativePath}`);
      }
    }
  }

  await visit(relativeRoot);
  return files;
}

const runtimeSources = [
  { source: 'bin/slides.mjs', runtimePath: 'bin/slides.mjs', mode: executableMode },
  ...(await sourceTreeFiles('lib')).map((source) => ({ source, runtimePath: source })),
  ...(await sourceTreeFiles('templates')).map((source) => ({
    source: source === 'templates/python-svg-plan.md'
      ? 'references/python-svg-plan.md'
      : source,
    runtimePath: source,
  })),
];

for (const runtimeSource of runtimeSources) {
  mappings.push({
    source: runtimeSource.source,
    mode: runtimeSource.mode,
    destinations: cliSkillNames.map(
      (name) => `skills/${name}/runtime/${runtimeSource.runtimePath}`,
    ),
  });
}

const managedRoots = new Map();
for (const name of skillNames) {
  for (const directory of ['references', 'scripts', 'runtime']) {
    managedRoots.set(`skills/${name}/${directory}`, new Set());
  }
}
managedRoots.set('.agents/skills', new Set());

function registerManagedFile(destination) {
  for (const [managedRoot, expectedFiles] of managedRoots) {
    const prefix = `${managedRoot}/`;
    if (destination.startsWith(prefix)) {
      expectedFiles.add(destination.slice(prefix.length));
      return;
    }
  }
}

for (const mapping of mappings) {
  for (const destination of mapping.destinations) registerManagedFile(destination);
}
for (const name of skillNames) {
  managedRoots.get('.agents/skills').add(`${name}/SKILL.md`);
}

const sourceContents = new Map();
for (const mapping of mappings) {
  if (sourceContents.has(mapping.source)) continue;
  const sourcePath = path.join(root, mapping.source);
  const sourceInfo = await lstat(sourcePath);
  if (!sourceInfo.isFile()) {
    throw new Error(`Canonical source must be a regular file: ${mapping.source}`);
  }
  sourceContents.set(mapping.source, await readFile(sourcePath));
}

let failures = 0;

function report(message) {
  console.error(message);
  failures += 1;
}

async function removeOrReport(relativePath, type = 'ORPHAN') {
  if (checkOnly) {
    report(`${type} ${relativePath} (run: npm run sync:skills)`);
  } else {
    await rm(path.join(root, relativePath), { recursive: true, force: true });
    console.log(`REMOVE ${relativePath}`);
  }
}

async function cleanManagedRoot(relativeRoot, expectedFiles) {
  const absoluteRoot = path.join(root, relativeRoot);
  let rootInfo;
  try {
    rootInfo = await lstat(absoluteRoot);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  if (!rootInfo.isDirectory()) {
    await removeOrReport(relativeRoot, 'INVALID GENERATED ROOT');
    return;
  }

  if (expectedFiles.size === 0) {
    await removeOrReport(relativeRoot, 'ORPHAN GENERATED ROOT');
    return;
  }

  async function visit(relativeDirectory = '') {
    const absoluteDirectory = path.join(absoluteRoot, relativeDirectory);
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const relativeEntry = relativeDirectory
        ? path.posix.join(relativeDirectory, entry.name)
        : entry.name;
      const expected = expectedFiles.has(relativeEntry);
      const expectedDescendant = [...expectedFiles].some(
        (candidate) => candidate.startsWith(`${relativeEntry}/`),
      );

      if (entry.isDirectory() && expectedDescendant) {
        await visit(relativeEntry);
      } else if (!entry.isDirectory() && expected) {
        // File type, content, link count, and mode are checked by syncGeneratedFile.
      } else {
        await removeOrReport(`${relativeRoot}/${relativeEntry}`);
      }
    }
  }

  await visit();
}

for (const [managedRoot, expectedFiles] of managedRoots) {
  await cleanManagedRoot(managedRoot, expectedFiles);
}

async function syncGeneratedFile(source, destination, mode = fileMode) {
  const destinationPath = path.join(root, destination);

  if (checkOnly) {
    try {
      const destinationInfo = await lstat(destinationPath);
      if (!destinationInfo.isFile() || destinationInfo.nlink !== 1) {
        report(`NOT A REGULAR GENERATED FILE ${destination} (run: npm run sync:skills)`);
        return;
      }

      const existing = await readFile(destinationPath);
      if (!existing.equals(source)) {
        report(`OUT OF SYNC ${destination} (run: npm run sync:skills)`);
      }

      if (process.platform !== 'win32' && (destinationInfo.mode & 0o777) !== mode) {
        report(
          `WRONG MODE ${destination} (expected ${mode.toString(8)}; run: npm run sync:skills)`,
        );
      }
    } catch (error) {
      report(`MISSING ${destination}: ${error.message}`);
    }
    return;
  }

  let destinationInfo;
  try {
    destinationInfo = await lstat(destinationPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (destinationInfo && (!destinationInfo.isFile() || destinationInfo.nlink !== 1)) {
    await rm(destinationPath, { recursive: true, force: true });
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, source);
  if (process.platform !== 'win32') await chmod(destinationPath, mode);
}

for (const mapping of mappings) {
  const source = sourceContents.get(mapping.source);
  for (const destination of mapping.destinations) {
    await syncGeneratedFile(source, destination, mapping.mode);
    if (!checkOnly) console.log(`SYNC ${mapping.source} -> ${destination}`);
  }
}

for (const name of skillNames) {
  const authoritative = await readFile(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');
  const frontmatter = authoritative.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
  if (!frontmatter) {
    report(`INVALID skills/${name}/SKILL.md: missing YAML frontmatter`);
    continue;
  }

  const forwarder = Buffer.from(
    `---\n${frontmatter[1].trim()}\n---\n\n# Repository skill forwarder\n\n` +
      `Read and follow \`../../../skills/${name}/SKILL.md\` as the authoritative workflow. ` +
      'Resolve bundled references and scripts relative to that authoritative skill directory.\n',
  );
  const destination = `.agents/skills/${name}/SKILL.md`;
  await syncGeneratedFile(forwarder, destination);
  if (!checkOnly) console.log(`SYNC skills/${name}/SKILL.md metadata -> ${destination}`);
}

if (failures > 0) {
  process.exitCode = 1;
} else if (checkOnly) {
  console.log('Portable skill resources are synchronized.');
}
