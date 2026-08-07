import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('release versions stay synchronized', async () => {
  const [plugin, marketplace, packageJson, packageLock] = await Promise.all([
    json('.codex-plugin/plugin.json'),
    json('.agents/plugins/marketplace.json'),
    json('package.json'),
    json('package-lock.json'),
  ]);

  const marketplacePlugin = marketplace.plugins.find((entry) => entry.name === plugin.name);
  assert.ok(marketplacePlugin);
  assert.equal(plugin.version, marketplacePlugin.version);
  assert.equal(plugin.version, packageJson.version);
  assert.equal(plugin.version, packageLock.version);
  assert.equal(plugin.version, packageLock.packages[''].version);
});

test('marketplace loads the root plugin with searchable fallback metadata', async () => {
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

test('Codex manifest exposes the skills bundle', async () => {
  const plugin = await json('.codex-plugin/plugin.json');
  assert.equal(plugin.name, 'claude-code-slides');
  assert.equal(plugin.skills, './skills/');
  assert.equal(plugin.interface.displayName, 'Claude Code Slides');
});
