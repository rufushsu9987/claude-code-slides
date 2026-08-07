import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('release versions stay synchronized', async () => {
  const [plugin, marketplace, packageJson] = await Promise.all([
    json('.claude-plugin/plugin.json'),
    json('.claude-plugin/marketplace.json'),
    json('package.json'),
  ]);

  const marketplacePlugin = marketplace.plugins.find((entry) => entry.name === plugin.name);
  assert.ok(marketplacePlugin);
  assert.equal(plugin.version, marketplacePlugin.version);
  assert.equal(plugin.version, marketplace.version);
  assert.equal(plugin.version, packageJson.version);
});

test('marketplace points to the canonical public repository', async () => {
  const marketplace = await json('.claude-plugin/marketplace.json');
  assert.deepEqual(marketplace.plugins[0].source, {
    source: 'github',
    repo: 'rufushsu9987/claude-code-slides',
  });
});
