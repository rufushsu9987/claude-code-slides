#!/usr/bin/env node

import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

const expectedSkills = [
  'claude-code-style',
  'create-deck',
  'deck-architect',
  'deck-reviewer',
  'review-deck',
  'speaker-notes',
  'visual-director',
];

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

const plugin = await readJson('.codex-plugin/plugin.json');
const marketplace = await readJson('.agents/plugins/marketplace.json');
const packageJson = await readJson('package.json');
const packageLock = await readJson('package-lock.json');

const required = [
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
  ...expectedSkills.map((name) => `skills/${name}/SKILL.md`),
  ...expectedSkills.map((name) => `.agents/skills/${name}/SKILL.md`),
  'references/style-system.md',
  'references/storytelling.md',
  'references/output-formats.md',
  'references/review-checklist.md',
  'bin/codex-slides.mjs',
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
  if (!plugin.description) errors.push('plugin.description is required');
  if (!/^\d+\.\d+\.\d+$/.test(plugin.version || '')) {
    errors.push('plugin.version must use semantic versioning');
  }
  if (plugin.skills !== './skills/') {
    errors.push('plugin.skills must point to ./skills/');
  }
  if (!plugin.interface?.displayName || !plugin.interface?.shortDescription) {
    errors.push('plugin.interface display metadata is required');
  }
}

if (marketplace) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(marketplace.name || '')) {
    errors.push('marketplace.name must be kebab-case');
  }
  if (!marketplace.interface?.displayName) {
    errors.push('marketplace.interface.displayName is required');
  }
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    errors.push('marketplace.plugins must contain at least one entry');
  }
}

if (plugin && marketplace && packageJson && packageLock) {
  const entry = marketplace.plugins?.find((candidate) => candidate.name === plugin.name);
  if (!entry) errors.push('marketplace does not list the plugin');
  if (entry?.source?.source !== 'local' || entry?.source?.path !== './') {
    errors.push('marketplace source must resolve the plugin from the marketplace root');
  }
  if (entry?.version !== plugin.version) {
    errors.push('marketplace fallback version must match plugin.json');
  }
  if (!entry?.description || !entry?.interface?.displayName) {
    errors.push('marketplace entry must include searchable fallback metadata');
  }
  if (entry?.interface?.displayName !== plugin.interface?.displayName) {
    errors.push('marketplace and plugin display names must match');
  }
  if (!Array.isArray(entry?.keywords) || !entry.keywords.includes('slides')) {
    errors.push('marketplace entry must include discovery keywords');
  }
  if (entry?.policy?.installation !== 'AVAILABLE') {
    errors.push('marketplace installation policy must be AVAILABLE');
  }
  if (!entry?.policy?.authentication) {
    errors.push('marketplace authentication policy is required');
  }
  if (entry?.category !== 'Productivity') {
    errors.push('marketplace category must be Productivity');
  }
  if (packageJson.version !== plugin.version || packageLock.version !== plugin.version) {
    errors.push('package and Codex manifest versions must match');
  }
  if (packageLock.packages?.['']?.version !== plugin.version) {
    errors.push('package-lock root package version must match');
  }
  if (packageJson.bin?.['codex-slides'] !== './bin/codex-slides.mjs') {
    errors.push('package.json must expose the codex-slides CLI');
  }
  if (packageJson.bin?.['claude-slides'] !== './bin/claude-slides.mjs') {
    errors.push('package.json must preserve the claude-slides compatibility alias');
  }
  if (!String(packageJson.engines?.node || '').includes('18')) {
    warnings.push('package.json should document Node.js 18+ compatibility');
  }
}

for (const name of expectedSkills) {
  const relativePath = `skills/${name}/SKILL.md`;
  if (!(await fileExists(relativePath))) continue;

  const content = await readFile(path.join(root, relativePath), 'utf8');
  const metadata = parseFrontmatter(content, relativePath);
  if (!metadata) continue;

  if (metadata.name !== name) {
    errors.push(`${relativePath}: name must match directory (${name})`);
  }
  if (!metadata.description) {
    errors.push(`${relativePath}: description is required`);
  }

  for (const forbidden of [
    '$ARGUMENTS',
    'CLAUDE_PLUGIN_ROOT',
    'claude-code-slides:',
    'argument-hint:',
    'effort:',
    'user-invocable:',
  ]) {
    if (content.includes(forbidden)) {
      errors.push(`${relativePath}: contains Claude-specific token ${forbidden}`);
    }
  }

  const forwarderPath = `.agents/skills/${name}/SKILL.md`;
  try {
    const forwarder = await readFile(path.join(root, forwarderPath), 'utf8');
    const forwarderMetadata = parseFrontmatter(forwarder, forwarderPath);
    if (forwarderMetadata?.name !== name) {
      errors.push(`${forwarderPath}: name must match ${name}`);
    }
    if (!forwarder.includes(`../../../skills/${name}/SKILL.md`)) {
      errors.push(`${forwarderPath}: must point to the authoritative skill`);
    }
  } catch (error) {
    errors.push(`${forwarderPath}: ${error.message}`);
  }
}

for (const forbiddenPath of [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  'agents/deck-architect.md',
  'agents/visual-director.md',
  'agents/deck-reviewer.md',
]) {
  if (await fileExists(forbiddenPath)) {
    errors.push(`${forbiddenPath} is a legacy Claude Code component and must be removed`);
  }
}

for (const executable of ['bin/codex-slides.mjs', 'bin/claude-slides.mjs']) {
  if (!(await fileExists(executable))) continue;
  const mode = (await stat(path.join(root, executable))).mode;
  if ((mode & 0o111) === 0) errors.push(`${executable} must be executable`);
}

if (await fileExists('README.md')) {
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  for (const skill of ['create-deck', 'review-deck', 'speaker-notes']) {
    if (!readme.includes(`$${skill}`)) {
      errors.push(`README.md must document $${skill}`);
    }
  }
  if (!readme.includes('codex plugin marketplace add')) {
    errors.push('README.md must document Codex marketplace installation');
  }
  if (!readme.includes('codex plugin marketplace upgrade rufus-slides')) {
    errors.push('README.md must document marketplace refresh');
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${plugin?.interface?.displayName || plugin?.name} ${plugin?.version}.`);
  console.log(`Found ${expectedSkills.length} Codex skills and ${expectedSkills.length} repo-scoped forwarders.`);
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
