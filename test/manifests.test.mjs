import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const AGENT_PLUGINS_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('release versions stay synchronized across portable and native plugin systems', async () => {
  const [
    portablePlugin,
    codexPlugin,
    codexMarketplace,
    claudePlugin,
    claudeMarketplace,
    packageJson,
    packageLock,
  ] = await Promise.all([
    json('plugin.json'),
    json('.codex-plugin/plugin.json'),
    json('.agents/plugins/marketplace.json'),
    json('.claude-plugin/plugin.json'),
    json('.claude-plugin/marketplace.json'),
    json('package.json'),
    json('package-lock.json'),
  ]);

  const codexEntry = codexMarketplace.plugins.find((entry) => entry.name === codexPlugin.name);
  const claudeEntry = claudeMarketplace.plugins.find((entry) => entry.name === claudePlugin.name);
  assert.ok(codexEntry);
  assert.ok(claudeEntry);

  const versions = [
    portablePlugin.version,
    codexPlugin.version,
    claudePlugin.version,
    codexEntry.version,
    claudeEntry.version,
    claudeMarketplace.version,
    packageJson.version,
    packageLock.version,
    packageLock.packages[''].version,
  ];
  assert.equal(new Set(versions).size, 1);
});

test('root plugin.json conforms to the Agent Plugins v1 portable manifest shape', async () => {
  const plugin = await json('plugin.json');
  const allowed = new Set([
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

  assert.equal(plugin.$schema, AGENT_PLUGINS_SCHEMA);
  assert.equal(plugin.name, 'claude-code-slides');
  assert.deepEqual(
    Object.keys(plugin).filter((key) => !allowed.has(key)),
    [],
  );
  assert.equal(plugin.extensions, undefined);
});

test('Codex marketplace loads the root plugin with searchable fallback metadata', async () => {
  const marketplace = await json('.agents/plugins/marketplace.json');
  const plugin = await json('.codex-plugin/plugin.json');
  const entry = marketplace.plugins[0];

  assert.deepEqual(entry.source, {
    source: 'local',
    path: './',
  });
  assert.equal(entry.policy.installation, 'AVAILABLE');
  assert.equal(entry.category, 'Productivity');
  assert.equal(entry.interface.displayName, plugin.interface.displayName);
  assert.equal(entry.description.length > 0, true);
  assert.equal(entry.keywords.includes('agent-plugins'), true);
  assert.equal(entry.keywords.includes('slides'), true);
});

test('Claude Code marketplace loads the root plugin', async () => {
  const marketplace = await json('.claude-plugin/marketplace.json');
  const plugin = await json('.claude-plugin/plugin.json');
  const entry = marketplace.plugins[0];

  assert.equal(entry.source, './');
  assert.equal(entry.displayName, plugin.displayName);
  assert.equal(entry.version, plugin.version);
  assert.equal(entry.keywords.includes('agent-plugins'), true);
  assert.equal(entry.keywords.includes('slides'), true);
});

test('native manifests expose the shared portable skills bundle', async () => {
  const [codex, claude] = await Promise.all([
    json('.codex-plugin/plugin.json'),
    json('.claude-plugin/plugin.json'),
  ]);

  assert.equal(codex.name, 'claude-code-slides');
  assert.equal(codex.skills, './skills/');
  assert.equal(codex.interface.displayName, 'Claude Code Slides');

  assert.equal(claude.name, 'claude-code-slides');
  assert.equal(claude.skills, './skills/');
  // Claude Code auto-discovers agents/*.md; the manifest must not use a directory path.
  assert.equal(claude.agents, undefined);
  assert.equal(claude.displayName, 'Claude Code Slides');
});
