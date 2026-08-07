import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('release versions stay synchronized across both plugin systems', async () => {
  const [
    codexPlugin,
    codexMarketplace,
    claudePlugin,
    claudeMarketplace,
    packageJson,
    packageLock,
  ] = await Promise.all([
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
  assert.equal(entry.keywords.includes('slides'), true);
});

test('Claude Code marketplace loads the root plugin', async () => {
  const marketplace = await json('.claude-plugin/marketplace.json');
  const plugin = await json('.claude-plugin/plugin.json');
  const entry = marketplace.plugins[0];

  assert.equal(entry.source, './');
  assert.equal(entry.displayName, plugin.displayName);
  assert.equal(entry.version, plugin.version);
  assert.equal(entry.keywords.includes('slides'), true);
});

test('Codex manifest exposes the shared skills bundle', async () => {
  const plugin = await json('.codex-plugin/plugin.json');
  assert.equal(plugin.name, 'claude-code-slides');
  assert.equal(plugin.skills, './skills/');
  assert.equal(plugin.interface.displayName, 'Claude Code Slides');
});

test('Claude Code manifest exposes shared skills and native subagents', async () => {
  const plugin = await json('.claude-plugin/plugin.json');
  assert.equal(plugin.name, 'claude-code-slides');
  assert.equal(plugin.skills, './skills/');
  assert.equal(plugin.agents, './agents/');
  assert.equal(plugin.displayName, 'Claude Code Slides');
});
