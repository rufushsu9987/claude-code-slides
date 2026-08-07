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

const expectedClaudeAgents = ['deck-architect', 'deck-reviewer', 'visual-director'];

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

const codexPlugin = await readJson('.codex-plugin/plugin.json');
const codexMarketplace = await readJson('.agents/plugins/marketplace.json');
const claudePlugin = await readJson('.claude-plugin/plugin.json');
const claudeMarketplace = await readJson('.claude-plugin/marketplace.json');
const packageJson = await readJson('package.json');
const packageLock = await readJson('package-lock.json');

const required = [
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  ...expectedSkills.map((name) => `skills/${name}/SKILL.md`),
  ...expectedSkills.map((name) => `.agents/skills/${name}/SKILL.md`),
  ...expectedClaudeAgents.map((name) => `agents/${name}.md`),
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
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'README.zh-TW.md',
  'LICENSE',
];

for (const relativePath of required) {
  if (!(await fileExists(relativePath))) errors.push(`missing ${relativePath}`);
}

function validatePluginName(plugin, label) {
  if (!plugin) return;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plugin.name || '')) {
    errors.push(`${label}.name must be kebab-case`);
  }
  if (!plugin.description) errors.push(`${label}.description is required`);
  if (!/^\d+\.\d+\.\d+$/.test(plugin.version || '')) {
    errors.push(`${label}.version must use semantic versioning`);
  }
}

validatePluginName(codexPlugin, 'Codex plugin');
validatePluginName(claudePlugin, 'Claude Code plugin');

if (codexPlugin) {
  if (codexPlugin.skills !== './skills/') {
    errors.push('Codex plugin.skills must point to ./skills/');
  }
  if (!codexPlugin.interface?.displayName || !codexPlugin.interface?.shortDescription) {
    errors.push('Codex plugin interface display metadata is required');
  }
}

if (claudePlugin) {
  if (claudePlugin.skills !== './skills/') {
    errors.push('Claude Code plugin.skills must point to ./skills/');
  }
  if (claudePlugin.agents !== './agents/') {
    errors.push('Claude Code plugin.agents must point to ./agents/');
  }
  if (!claudePlugin.displayName) {
    errors.push('Claude Code plugin.displayName is required');
  }
}

if (codexMarketplace) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(codexMarketplace.name || '')) {
    errors.push('Codex marketplace.name must be kebab-case');
  }
  if (!codexMarketplace.interface?.displayName) {
    errors.push('Codex marketplace.interface.displayName is required');
  }
  if (!Array.isArray(codexMarketplace.plugins) || codexMarketplace.plugins.length === 0) {
    errors.push('Codex marketplace.plugins must contain at least one entry');
  }
}

if (claudeMarketplace) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(claudeMarketplace.name || '')) {
    errors.push('Claude Code marketplace.name must be kebab-case');
  }
  if (!claudeMarketplace.owner?.name) {
    errors.push('Claude Code marketplace.owner.name is required');
  }
  if (!Array.isArray(claudeMarketplace.plugins) || claudeMarketplace.plugins.length === 0) {
    errors.push('Claude Code marketplace.plugins must contain at least one entry');
  }
}

if (
  codexPlugin &&
  codexMarketplace &&
  claudePlugin &&
  claudeMarketplace &&
  packageJson &&
  packageLock
) {
  const codexEntry = codexMarketplace.plugins?.find(
    (candidate) => candidate.name === codexPlugin.name,
  );
  const claudeEntry = claudeMarketplace.plugins?.find(
    (candidate) => candidate.name === claudePlugin.name,
  );

  if (!codexEntry) errors.push('Codex marketplace does not list the plugin');
  if (!claudeEntry) errors.push('Claude Code marketplace does not list the plugin');

  if (codexEntry?.source?.source !== 'local' || codexEntry?.source?.path !== './') {
    errors.push('Codex marketplace source must resolve the plugin from the marketplace root');
  }
  if (claudeEntry?.source !== './') {
    errors.push('Claude Code marketplace source must resolve the plugin from the marketplace root');
  }

  const versions = [
    codexPlugin.version,
    claudePlugin.version,
    codexEntry?.version,
    claudeEntry?.version,
    claudeMarketplace.version,
    packageJson.version,
    packageLock.version,
    packageLock.packages?.['']?.version,
  ];
  if (versions.some((value) => value !== codexPlugin.version)) {
    errors.push('Codex, Claude Code, package, lockfile, and marketplace versions must match');
  }

  if (!codexEntry?.description || !codexEntry?.interface?.displayName) {
    errors.push('Codex marketplace entry must include searchable fallback metadata');
  }
  if (!claudeEntry?.description || !claudeEntry?.displayName) {
    errors.push('Claude Code marketplace entry must include display metadata');
  }
  if (codexEntry?.interface?.displayName !== codexPlugin.interface?.displayName) {
    errors.push('Codex marketplace and plugin display names must match');
  }
  if (claudeEntry?.displayName !== claudePlugin.displayName) {
    errors.push('Claude Code marketplace and plugin display names must match');
  }
  if (!Array.isArray(codexEntry?.keywords) || !codexEntry.keywords.includes('slides')) {
    errors.push('Codex marketplace entry must include discovery keywords');
  }
  if (!Array.isArray(claudeEntry?.keywords) || !claudeEntry.keywords.includes('slides')) {
    errors.push('Claude Code marketplace entry must include discovery keywords');
  }
  if (codexEntry?.policy?.installation !== 'AVAILABLE') {
    errors.push('Codex marketplace installation policy must be AVAILABLE');
  }
  if (!codexEntry?.policy?.authentication) {
    errors.push('Codex marketplace authentication policy is required');
  }
  if (codexEntry?.category !== 'Productivity') {
    errors.push('Codex marketplace category must be Productivity');
  }

  if (packageJson.bin?.['codex-slides'] !== './bin/codex-slides.mjs') {
    errors.push('package.json must expose the codex-slides CLI');
  }
  if (packageJson.bin?.['claude-slides'] !== './bin/claude-slides.mjs') {
    errors.push('package.json must expose the claude-slides CLI');
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
    'argument-hint:',
    'effort:',
    'user-invocable:',
  ]) {
    if (content.includes(forbidden)) {
      errors.push(`${relativePath}: contains host-specific frontmatter or runtime token ${forbidden}`);
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

for (const name of expectedClaudeAgents) {
  const relativePath = `agents/${name}.md`;
  if (!(await fileExists(relativePath))) continue;
  const content = await readFile(path.join(root, relativePath), 'utf8');
  const metadata = parseFrontmatter(content, relativePath);
  if (!metadata) continue;

  if (metadata.name !== name) {
    errors.push(`${relativePath}: name must match filename (${name})`);
  }
  if (!metadata.description || !metadata.model) {
    errors.push(`${relativePath}: description and model are required`);
  }
  if (!content.includes('${CLAUDE_PLUGIN_ROOT}')) {
    errors.push(`${relativePath}: must use CLAUDE_PLUGIN_ROOT for cached plugin paths`);
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
      errors.push(`README.md must document Codex skill $${skill}`);
    }
    if (!readme.includes(`/claude-code-slides:${skill}`)) {
      errors.push(`README.md must document Claude Code skill /claude-code-slides:${skill}`);
    }
  }
  if (!readme.includes('codex plugin marketplace add')) {
    errors.push('README.md must document Codex marketplace installation');
  }
  if (!readme.includes('claude plugin marketplace add')) {
    errors.push('README.md must document Claude Code marketplace installation');
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated dual-platform Claude Code Slides ${codexPlugin?.version}.`);
  console.log(
    `Found ${expectedSkills.length} shared skills, ${expectedSkills.length} Codex forwarders, and ${expectedClaudeAgents.length} Claude Code agents.`,
  );
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
