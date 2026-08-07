#!/usr/bin/env node

import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

const skillFields = new Set([
  'name',
  'description',
  'when_to_use',
  'argument-hint',
  'arguments',
  'disable-model-invocation',
  'user-invocable',
  'allowed-tools',
  'model',
  'effort',
  'context',
  'agent',
  'hooks',
  'paths',
  'shell',
]);

const agentFields = new Set([
  'name',
  'description',
  'model',
  'effort',
  'maxTurns',
  'tools',
  'disallowedTools',
  'skills',
  'memory',
  'background',
  'isolation',
]);

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

function parseFrontmatter(content, relativePath) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
  if (!match) {
    errors.push(`${relativePath}: missing YAML frontmatter`);
    return null;
  }

  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s/.test(line)) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }
  return values;
}

async function fileExists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function markdownFiles(directory) {
  const absolute = path.join(root, directory);
  const output = [];
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await markdownFiles(relative)));
    else if (entry.name.endsWith('.md')) output.push(relative);
  }
  return output;
}

const plugin = await readJson('.claude-plugin/plugin.json');
const marketplace = await readJson('.claude-plugin/marketplace.json');
const packageJson = await readJson('package.json');

const required = [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  'skills/create-deck/SKILL.md',
  'skills/review-deck/SKILL.md',
  'skills/speaker-notes/SKILL.md',
  'skills/claude-code-style/SKILL.md',
  'agents/deck-architect.md',
  'agents/visual-director.md',
  'agents/deck-reviewer.md',
  'references/style-system.md',
  'references/storytelling.md',
  'references/output-formats.md',
  'references/review-checklist.md',
  'bin/claude-slides.mjs',
  'lib/cli.mjs',
  'templates/html/index.html',
  'templates/html/theme.css',
  'templates/html/slides.js',
  'templates/marp/deck.md',
  'templates/marp/theme.css',
  'templates/pptx/deck.mjs',
  'templates/pptx/package.json',
  'examples/ai-platform/index.html',
  'docs/images/hero.svg',
  'README.md',
  'README.zh-TW.md',
  'LICENSE',
];

for (const relativePath of required) {
  if (!(await fileExists(relativePath))) errors.push(`missing ${relativePath}`);
}

if (plugin) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plugin.name || '')) {
    errors.push('plugin.name must be kebab-case');
  }
  if (plugin.$schema !== 'https://json.schemastore.org/claude-code-plugin-manifest.json') {
    warnings.push('plugin.json should declare the Claude Code plugin schema');
  }
  if (!plugin.description) errors.push('plugin.description is required');
  if (!/^\d+\.\d+\.\d+$/.test(plugin.version || '')) {
    errors.push('plugin.version must use semantic versioning');
  }
  if (plugin.skills !== './skills/' || plugin.agents !== './agents/') {
    errors.push('plugin component paths must point to root skills/ and agents/ directories');
  }
}

if (marketplace) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(marketplace.name || '')) {
    errors.push('marketplace.name must be kebab-case');
  }
  if (!marketplace.owner?.name) errors.push('marketplace.owner.name is required');
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    errors.push('marketplace.plugins must contain at least one entry');
  }
}

if (plugin && marketplace && packageJson) {
  const entry = marketplace.plugins?.find((candidate) => candidate.name === plugin.name);
  if (!entry) errors.push('marketplace does not list the plugin');
  if (entry?.version !== plugin.version) errors.push('marketplace plugin version must match plugin.json');
  if (marketplace.version !== plugin.version || packageJson.version !== plugin.version) {
    errors.push('package and manifest versions must match');
  }
  if (entry?.source?.source !== 'github' || entry?.source?.repo !== 'rufushsu9987/claude-code-slides') {
    errors.push('marketplace source must reference rufushsu9987/claude-code-slides');
  }
  if (packageJson.bin?.['claude-slides'] !== './bin/claude-slides.mjs') {
    errors.push('package.json must expose the claude-slides CLI');
  }
  if (!String(packageJson.engines?.node || '').includes('18')) {
    warnings.push('package.json should document Node.js 18+ compatibility');
  }
}

for (const relativePath of await markdownFiles('skills')) {
  if (path.basename(relativePath) !== 'SKILL.md') continue;
  const content = await readFile(path.join(root, relativePath), 'utf8');
  const metadata = parseFrontmatter(content, relativePath);
  if (!metadata) continue;

  const expectedName = path.basename(path.dirname(relativePath));
  if (!metadata.name) errors.push(`${relativePath}: name is required`);
  if (metadata.name && metadata.name !== expectedName) {
    errors.push(`${relativePath}: name must match directory (${expectedName})`);
  }
  if (!metadata.description) errors.push(`${relativePath}: description is required`);
  for (const key of Object.keys(metadata)) {
    if (!skillFields.has(key)) warnings.push(`${relativePath}: unrecognized skill field ${key}`);
  }
}

for (const relativePath of await markdownFiles('agents')) {
  const content = await readFile(path.join(root, relativePath), 'utf8');
  const metadata = parseFrontmatter(content, relativePath);
  if (!metadata) continue;

  const expectedName = path.basename(relativePath, '.md');
  if (!metadata.name) errors.push(`${relativePath}: name is required`);
  if (metadata.name && metadata.name !== expectedName) {
    errors.push(`${relativePath}: name must match filename (${expectedName})`);
  }
  if (!metadata.description) errors.push(`${relativePath}: description is required`);
  if (metadata.isolation && metadata.isolation !== 'worktree') {
    errors.push(`${relativePath}: isolation must be worktree when set`);
  }
  for (const key of Object.keys(metadata)) {
    if (!agentFields.has(key)) warnings.push(`${relativePath}: unrecognized agent field ${key}`);
  }
}

for (const forbidden of ['.claude-plugin/skills', '.claude-plugin/agents', '.claude-plugin/hooks']) {
  if (await fileExists(forbidden)) errors.push(`${forbidden} must be at the plugin root`);
}

if (await fileExists('bin/claude-slides.mjs')) {
  const mode = (await stat(path.join(root, 'bin/claude-slides.mjs'))).mode;
  if ((mode & 0o111) === 0) errors.push('bin/claude-slides.mjs must be executable');
}

if (await fileExists('README.md')) {
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  for (const command of ['create-deck', 'review-deck', 'speaker-notes']) {
    if (!readme.includes(`/claude-code-slides:${command}`)) {
      errors.push(`README.md must document /claude-code-slides:${command}`);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${plugin?.displayName || plugin?.name} ${plugin?.version}.`);
  console.log(`Found ${(await markdownFiles('skills')).filter((file) => file.endsWith('SKILL.md')).length} skills and ${(await markdownFiles('agents')).length} agents.`);
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
