import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('release versions stay synchronized', async () => {
  const [plugin, packageJson, packageLock] = await Promise.all([
    json('.codex-plugin/plugin.json'),
    json('package.json'),
    json('package-lock.json'),
  ]);

  assert.equal(plugin.version, packageJson.version);
  assert.equal(plugin.version, packageLock.version);
  assert.equal(plugin.version, packageLock.packages[''].version);
});

test('marketplace points to the canonical public repository', async () => {
  const marketplace = await json('.agents/plugins/marketplace.json');
  assert.deepEqual(marketplace.plugins[0].source, {
    source: 'url',
    url: 'https://github.com/rufushsu9987/claude-code-slides.git',
    ref: 'main',
  });
  assert.equal(marketplace.plugins[0].policy.installation, 'AVAILABLE');
  assert.equal(marketplace.plugins[0].category, 'Productivity');
});

test('Codex manifest exposes the skills bundle', async () => {
  const plugin = await json('.codex-plugin/plugin.json');
  assert.equal(plugin.name, 'claude-code-slides');
  assert.equal(plugin.skills, './skills/');
  assert.equal(plugin.interface.displayName, 'Claude Code Slides');
});
