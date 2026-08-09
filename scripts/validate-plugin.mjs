#!/usr/bin/env node

import { access, lstat, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

const AGENT_PLUGINS_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';

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
const cliSkillNames = ['create-deck', 'review-deck', 'deck-reviewer'];
const SEMVER_PATTERN =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const portableManifestFields = new Set([
  '$schema',
  'name',
  'version',
  'description',
  'author',
  'homepage',
  'repository',
  'license',
  'keywords',
  'extensions',
]);

const skillResources = {
  'claude-code-style': ['references/style-system.md'],
  'create-deck': [
    'references/storytelling.md',
    'references/visual-quality.md',
    'references/style-system.md',
    'references/layout-system.md',
    'references/python-svg-authoring.md',
    'references/python-svg-plan.md',
    'references/output-formats.md',
    'scripts/slides-cli.mjs',
    'scripts/generate-slide-art.py',
  ],
  'deck-architect': ['references/storytelling.md'],
  'deck-reviewer': [
    'references/review-checklist.md',
    'references/visual-quality.md',
    'references/layout-system.md',
    'references/python-svg-authoring.md',
    'references/python-svg-plan.md',
    'scripts/slides-cli.mjs',
    'scripts/generate-slide-art.py',
  ],
  'review-deck': [
    'references/review-checklist.md',
    'references/visual-quality.md',
    'references/style-system.md',
    'references/layout-system.md',
    'references/python-svg-authoring.md',
    'references/python-svg-plan.md',
    'references/output-formats.md',
    'scripts/slides-cli.mjs',
    'scripts/generate-slide-art.py',
  ],
  'speaker-notes': [],
  'visual-director': [
    'references/visual-quality.md',
    'references/style-system.md',
    'references/layout-system.md',
    'references/python-svg-authoring.md',
    'references/python-svg-plan.md',
    'scripts/generate-slide-art.py',
  ],
};

async function treeFiles(relativeRoot) {
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
        errors.push(`runtime source must be a regular file: ${relativePath}`);
      }
    }
  }

  await visit(relativeRoot);
  return files;
}

const runtimeBundleFiles = [
  'bin/slides.mjs',
  ...(await treeFiles('lib')),
  ...(await treeFiles('templates')),
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

function validatePluginIdentity(plugin, label) {
  if (!plugin) return;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plugin.name || '')) {
    errors.push(`${label}.name must be kebab-case`);
  }
  if (!plugin.description) errors.push(`${label}.description is required`);
  if (!SEMVER_PATTERN.test(plugin.version || '')) {
    errors.push(`${label}.version must use semantic versioning`);
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const portablePlugin = await readJson('plugin.json');
const codexPlugin = await readJson('.codex-plugin/plugin.json');
const codexMarketplace = await readJson('.agents/plugins/marketplace.json');
const claudePlugin = await readJson('.claude-plugin/plugin.json');
const claudeMarketplace = await readJson('.claude-plugin/marketplace.json');
const packageJson = await readJson('package.json');
const packageLock = await readJson('package-lock.json');

const required = [
  'plugin.json',
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  ...expectedSkills.map((name) => `skills/${name}/SKILL.md`),
  ...expectedSkills.map((name) => `.agents/skills/${name}/SKILL.md`),
  ...expectedClaudeAgents.map((name) => `agents/${name}.md`),
  ...Object.entries(skillResources).flatMap(([name, resources]) =>
    resources.map((resource) => `skills/${name}/${resource}`),
  ),
  ...runtimeBundleFiles,
  ...cliSkillNames.flatMap((name) =>
    runtimeBundleFiles.map((resource) => `skills/${name}/runtime/${resource}`),
  ),
  'references/style-system.md',
  'references/visual-quality.md',
  'references/storytelling.md',
  'references/python-svg-plan.md',
  'references/output-formats.md',
  'references/review-checklist.md',
  'templates/python-svg-plan.md',
  'scripts/generate-slide-art.py',
  'scripts/skill-cli-wrapper.mjs',
  'scripts/sync-skill-resources.mjs',
  'scripts/sync-release-metadata.mjs',
  'scripts/validate-release.mjs',
  '.github/workflows/release.yml',
  'bin/codex-slides.mjs',
  'bin/claude-slides.mjs',
  'examples/ai-platform/index.html',
  'docs/images/hero.svg',
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'README.zh-TW.md',
  'LICENSE',
];

const bundledRuntimePaths = cliSkillNames.flatMap((name) =>
  runtimeBundleFiles.map((resource) => `skills/${name}/runtime/${resource}`),
);

for (const relativePath of required) {
  if (!(await fileExists(relativePath))) errors.push(`missing ${relativePath}`);
}

for (const relativePath of bundledRuntimePaths) {
  if (!(await fileExists(relativePath))) continue;
  const info = await lstat(path.join(root, relativePath));
  if (!info.isFile()) errors.push(`${relativePath} must be a local regular file`);
}

validatePluginIdentity(portablePlugin, 'Agent Plugins manifest');
validatePluginIdentity(codexPlugin, 'Codex plugin');
validatePluginIdentity(claudePlugin, 'Claude Code plugin');

if (portablePlugin) {
  if (portablePlugin.$schema !== AGENT_PLUGINS_SCHEMA) {
    errors.push(`plugin.json.$schema must be ${AGENT_PLUGINS_SCHEMA}`);
  }
  if (
    typeof portablePlugin.description !== 'string' ||
    portablePlugin.description.trim() === ''
  ) {
    errors.push('plugin.json.description must be a non-empty string');
  }
  if (!isRecord(portablePlugin.author) || typeof portablePlugin.author.name !== 'string') {
    errors.push('plugin.json.author must be an object with a string name');
  } else if (
    portablePlugin.author.name.trim() === '' ||
    typeof portablePlugin.author.url !== 'string' ||
    portablePlugin.author.url.trim() === ''
  ) {
    errors.push('plugin.json.author must include non-empty string name and url fields');
  }
  for (const field of ['homepage', 'repository', 'license']) {
    if (typeof portablePlugin[field] !== 'string' || portablePlugin[field].trim() === '') {
      errors.push(`plugin.json.${field} must be a non-empty string`);
    }
  }
  if (
    !Array.isArray(portablePlugin.keywords) ||
    portablePlugin.keywords.some(
      (keyword) => typeof keyword !== 'string' || keyword.trim() === '',
    )
  ) {
    errors.push('plugin.json.keywords must be an array of non-empty strings');
  }

  for (const key of Object.keys(portablePlugin)) {
    if (!portableManifestFields.has(key)) {
      errors.push(`plugin.json contains non-portable top-level field ${key}`);
    }
  }

  if (portablePlugin.extensions !== undefined && !isRecord(portablePlugin.extensions)) {
    errors.push('plugin.json.extensions must be an object when present');
  } else if (portablePlugin.extensions !== undefined) {
    for (const [namespace, extension] of Object.entries(portablePlugin.extensions)) {
      if (!isRecord(extension)) {
        errors.push(`plugin.json.extensions must define object namespace ${namespace}`);
      }
    }
  }
}

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
  if (claudePlugin.agents !== undefined) {
    const agentPaths = Array.isArray(claudePlugin.agents)
      ? claudePlugin.agents
      : [claudePlugin.agents];
    const invalidAgentPath = agentPaths.some(
      (agentPath) =>
        typeof agentPath !== 'string' ||
        !agentPath.startsWith('./') ||
        !agentPath.endsWith('.md'),
    );

    if (invalidAgentPath) {
      errors.push(
        'Claude Code plugin.agents must be omitted for agents/ auto-discovery or list ./.../*.md files',
      );
    } else {
      for (const agentPath of agentPaths) {
        if (!(await fileExists(agentPath))) {
          errors.push(`Claude Code plugin.agents references missing ${agentPath}`);
        }
      }
    }
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
  portablePlugin &&
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
    portablePlugin.version,
    codexPlugin.version,
    claudePlugin.version,
    codexEntry?.version,
    claudeEntry?.version,
    claudeMarketplace.version,
    packageJson.version,
    packageLock.version,
    packageLock.packages?.['']?.version,
  ];
  if (versions.some((value) => value !== portablePlugin.version)) {
    errors.push(
      'Agent Plugins, Codex, Claude Code, package, lockfile, and marketplace versions must match',
    );
  }

  for (const [label, plugin] of [
    ['Codex', codexPlugin],
    ['Claude Code', claudePlugin],
  ]) {
    if (plugin.name !== portablePlugin.name) {
      errors.push(`${label} plugin name must match portable plugin.json`);
    }
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

const actualSkillDirectories = (await readdir(path.join(root, 'skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (JSON.stringify(actualSkillDirectories) !== JSON.stringify(expectedSkills)) {
  errors.push(
    `skills/ immediate child directories must be exactly: ${expectedSkills.join(', ')}`,
  );
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
  const metadataFields = Object.keys(metadata).sort();
  if (JSON.stringify(metadataFields) !== JSON.stringify(['description', 'name'])) {
    errors.push(`${relativePath}: frontmatter must contain only name and description`);
  }

  for (const forbidden of [
    '$ARGUMENTS',
    'argument-hint:',
    'effort:',
    'user-invocable:',
    'CLAUDE_PLUGIN_ROOT',
    '<plugin-root>',
    'claude-code-slides:',
  ]) {
    if (content.includes(forbidden)) {
      errors.push(`${relativePath}: contains host-specific token ${forbidden}`);
    }
  }

  if (content.includes('../')) {
    errors.push(`${relativePath}: resources must be referenced from the skill root`);
  }

  for (const resource of skillResources[name]) {
    if (!content.includes(resource)) {
      errors.push(`${relativePath}: must reference bundled resource ${resource}`);
    }
  }

  const forwarderPath = `.agents/skills/${name}/SKILL.md`;
  try {
    const forwarder = await readFile(path.join(root, forwarderPath), 'utf8');
    const forwarderMetadata = parseFrontmatter(forwarder, forwarderPath);
    if (forwarderMetadata?.name !== name) {
      errors.push(`${forwarderPath}: name must match ${name}`);
    }
    if (forwarderMetadata?.description !== metadata.description) {
      errors.push(`${forwarderPath}: description must match ${relativePath}`);
    }
    if (
      forwarderMetadata &&
      JSON.stringify(Object.keys(forwarderMetadata).sort()) !==
        JSON.stringify(['description', 'name'])
    ) {
      errors.push(`${forwarderPath}: frontmatter must contain only name and description`);
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

if (await fileExists('scripts/skill-cli-wrapper.mjs')) {
  const wrapper = await readFile(path.join(root, 'scripts/skill-cli-wrapper.mjs'), 'utf8');
  if (!wrapper.includes("'runtime', 'bin', 'slides.mjs'")) {
    errors.push('scripts/skill-cli-wrapper.mjs must resolve the skill-local neutral runtime');
  }
  if (/codex|claude|pluginRoot|\.\.\/\.\.\//i.test(wrapper)) {
    errors.push('scripts/skill-cli-wrapper.mjs must not depend on a host or plugin root');
  }
}

for (const executable of [
  'bin/slides.mjs',
  'bin/codex-slides.mjs',
  'bin/claude-slides.mjs',
  'scripts/generate-slide-art.py',
  'scripts/skill-cli-wrapper.mjs',
  'scripts/sync-skill-resources.mjs',
  'scripts/sync-release-metadata.mjs',
  'scripts/validate-release.mjs',
  'skills/create-deck/scripts/slides-cli.mjs',
  'skills/create-deck/scripts/generate-slide-art.py',
  'skills/review-deck/scripts/slides-cli.mjs',
  'skills/review-deck/scripts/generate-slide-art.py',
  'skills/deck-reviewer/scripts/slides-cli.mjs',
  'skills/deck-reviewer/scripts/generate-slide-art.py',
  'skills/visual-director/scripts/generate-slide-art.py',
  ...cliSkillNames.map((name) => `skills/${name}/runtime/bin/slides.mjs`),
]) {
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
  if (!readme.includes(AGENT_PLUGINS_SCHEMA)) {
    errors.push('README.md must document Agent Plugins 1.0.0');
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
  console.log(
    `Validated Agent Plugins v1 portable core and native adapters ${portablePlugin?.version}.`,
  );
  console.log(
    `Found ${expectedSkills.length} portable skills, ${expectedSkills.length} Codex forwarders, and ${expectedClaudeAgents.length} Claude Code agents.`,
  );
}

for (const warning of warnings) console.warn(`WARN  ${warning}`);
