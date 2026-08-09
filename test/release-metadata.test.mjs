import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('generated release metadata is synchronized and avoids volatile catalog counts', async () => {
  const result = spawnSync(process.execPath, ['scripts/sync-release-metadata.mjs', '--check'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const [packageSource, packageLockSource, portableSource, runtimeSource, codexSource, claudeSource, codexMarketplaceSource, claudeMarketplaceSource] =
    await Promise.all(
      [
        'package.json',
        'package-lock.json',
        'plugin.json',
        'lib/runtime.mjs',
        '.codex-plugin/plugin.json',
        '.claude-plugin/plugin.json',
        '.agents/plugins/marketplace.json',
        '.claude-plugin/marketplace.json',
      ].map((file) => readFile(file, 'utf8')),
    );
  const packageJson = JSON.parse(packageSource);
  const packageLock = JSON.parse(packageLockSource);
  const portable = JSON.parse(portableSource);
  const codex = JSON.parse(codexSource);
  const claude = JSON.parse(claudeSource);
  const codexMarketplace = JSON.parse(codexMarketplaceSource);
  const claudeMarketplace = JSON.parse(claudeMarketplaceSource);
  const descriptions = [
    packageJson.description,
    portable.description,
    codex.description,
    codex.interface.longDescription,
    claude.description,
    ...codexMarketplace.plugins.flatMap((entry) => [
      entry.description,
      entry.interface?.longDescription,
    ]),
    ...claudeMarketplace.plugins.map((entry) => entry.description),
  ].filter(Boolean);
  for (const description of descriptions) assert.doesNotMatch(description, /\b(?:nineteen|19)\b/i);

  assert.equal(packageLock.version, packageJson.version);
  assert.equal(packageLock.packages[''].version, packageJson.version);
  assert.deepEqual(packageLock.packages[''].engines, packageJson.engines);
  assert.match(runtimeSource, new RegExp(`export const VERSION = '${packageJson.version.replaceAll('.', '\\.')}';`));
});

test('documentation tracks current catalog, starter, and renderer counts', async () => {
  const [english, traditionalChinese, templateSource, layoutSource] = await Promise.all([
    readFile('README.md', 'utf8'),
    readFile('README.zh-TW.md', 'utf8'),
    readFile('templates/catalog.json', 'utf8'),
    readFile('templates/layouts.json', 'utf8'),
  ]);
  const templates = JSON.parse(templateSource).templates.length;
  const layouts = JSON.parse(layoutSource);
  const generator = spawnSync('python3', ['scripts/generate-slide-art.py', '--list-kinds'], {
    encoding: 'utf8',
  });
  assert.equal(generator.status, 0, generator.stderr || generator.stdout);
  const rendererKinds = generator.stdout.trim().split('\n').filter(Boolean).length;

  assert.match(english, new RegExp(`\\b${templates} visual themes\\b`));
  assert.match(english, new RegExp(`\\b${layouts.archetypes.length} semantic layout archetypes\\b`));
  assert.match(english, new RegExp(`\\b${layouts.starterSequence.length} distinct starter layouts`));
  assert.match(english, new RegExp(`\\b${rendererKinds} reference kinds\\b`));
  assert.match(traditionalChinese, new RegExp(`${templates} 種視覺主題`));
  assert.match(traditionalChinese, new RegExp(`${layouts.archetypes.length} 種內容導向版型`));
  assert.match(traditionalChinese, new RegExp(`${layouts.starterSequence.length} 種不同版型`));
  assert.match(traditionalChinese, new RegExp(`${rendererKinds} 種經測試`));
});
