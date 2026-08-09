#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const descriptions = {
  package:
    'Agent-first presentation workflows with semantic layouts and native Codex and Claude Code adapters.',
  portable:
    'Create, review, and rehearse story-driven HTML, Marp, and editable PowerPoint presentations with portable Agent Skills and professional visual themes.',
  native:
    'Create, review, and rehearse portable HTML, Marp, and editable PowerPoint presentations with professional visual themes and semantic layouts.',
  listing:
    'Create portable HTML, Marp, and editable PowerPoint presentations with professional visual themes and semantic layouts.',
  long:
    'Turn briefs, documents, URLs, and repositories into story-driven HTML, Marp, or editable PowerPoint decks with professional visual themes, semantic layouts, deterministic validation, and independent review.',
};

async function readJson(relativePath) {
  const source = await readFile(path.join(root, relativePath), 'utf8');
  return { source, value: JSON.parse(source) };
}

function renderLike(source, value) {
  const trailingNewline = source.endsWith('\n') ? '\n' : '';
  const indented = source.trimStart().startsWith('{\n');
  return `${JSON.stringify(value, null, indented ? 2 : 0)}${trailingNewline}`;
}

const packageFile = await readJson('package.json');
const version = packageFile.value.version;
const pluginName = packageFile.value.name;
packageFile.value.description = descriptions.package;

const packageLock = await readJson('package-lock.json');
packageLock.value.name = pluginName;
packageLock.value.version = version;
if (!packageLock.value.packages?.['']) {
  throw new Error('package-lock.json is missing the root package entry');
}
packageLock.value.packages[''].name = pluginName;
packageLock.value.packages[''].version = version;
packageLock.value.packages[''].engines = packageFile.value.engines;

const portable = await readJson('plugin.json');
portable.value.version = version;
portable.value.description = descriptions.portable;

const codex = await readJson('.codex-plugin/plugin.json');
codex.value.version = version;
codex.value.description = descriptions.native;
codex.value.interface.longDescription = descriptions.long;
codex.value.interface.brandColor = '#AD563A';

const claude = await readJson('.claude-plugin/plugin.json');
claude.value.version = version;
claude.value.description = descriptions.native;

const codexMarketplace = await readJson('.agents/plugins/marketplace.json');
const codexEntry = codexMarketplace.value.plugins.find((entry) => entry.name === pluginName);
if (!codexEntry) throw new Error(`Codex marketplace does not list ${pluginName}`);
codexEntry.version = version;
codexEntry.description = descriptions.listing;
codexEntry.interface.longDescription = descriptions.long;
codexEntry.interface.brandColor = '#AD563A';

const claudeMarketplace = await readJson('.claude-plugin/marketplace.json');
claudeMarketplace.value.version = version;
const claudeEntry = claudeMarketplace.value.plugins.find((entry) => entry.name === pluginName);
if (!claudeEntry) throw new Error(`Claude Code marketplace does not list ${pluginName}`);
claudeEntry.version = version;
claudeEntry.description = descriptions.listing;

const files = new Map([
  ['package.json', packageFile],
  ['package-lock.json', packageLock],
  ['plugin.json', portable],
  ['.codex-plugin/plugin.json', codex],
  ['.claude-plugin/plugin.json', claude],
  ['.agents/plugins/marketplace.json', codexMarketplace],
  ['.claude-plugin/marketplace.json', claudeMarketplace],
]);

let failures = 0;
for (const [relativePath, file] of files) {
  const rendered = renderLike(file.source, file.value);
  if (checkOnly) {
    if (rendered !== file.source) {
      console.error(`OUT OF SYNC ${relativePath} (run: npm run sync:metadata)`);
      failures += 1;
    }
  } else if (rendered !== file.source) {
    await writeFile(path.join(root, relativePath), rendered, 'utf8');
    console.log(`SYNC ${relativePath}`);
  }
}

const runtimePath = path.join(root, 'lib/runtime.mjs');
const runtimeSource = await readFile(runtimePath, 'utf8');
const versionPattern = /^export const VERSION = ['"][^'"]+['"];$/m;
if (!versionPattern.test(runtimeSource)) {
  throw new Error('lib/runtime.mjs is missing the exported VERSION constant');
}
const runtimeRendered = runtimeSource.replace(
  versionPattern,
  `export const VERSION = '${version}';`,
);
if (checkOnly) {
  if (runtimeRendered !== runtimeSource) {
    console.error('OUT OF SYNC lib/runtime.mjs (run: npm run sync:metadata)');
    failures += 1;
  }
} else if (runtimeRendered !== runtimeSource) {
  await writeFile(runtimePath, runtimeRendered, 'utf8');
  console.log('SYNC lib/runtime.mjs');
}

if (failures > 0) process.exitCode = 1;
else if (checkOnly) console.log('Release metadata is synchronized.');
