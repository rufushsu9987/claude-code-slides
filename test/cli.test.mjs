import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkDeck, doctor, initDeck, slugify } from '../lib/cli.mjs';

test('doctor accepts the documented Node.js baseline', () => {
  assert.equal(doctor().node.available, Number(process.versions.node.split('.')[0]) >= 18);
});

test('slugify creates stable portable identifiers', () => {
  assert.equal(slugify('AI Agent Platform 2026'), 'ai-agent-platform-2026');
  assert.equal(slugify('  Cloud / Native  '), 'cloud-native');
  assert.equal(slugify('企業 AI 平台'), '企業-ai-平台');
  assert.equal(slugify('---'), 'presentation');
});

for (const format of ['html', 'marp', 'pptx']) {
  test(`initDeck scaffolds and validates ${format}`, async (t) => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), `claude-slides-${format}-`));
    t.after(() => rm(temporary, { recursive: true, force: true }));

    const destination = path.join(temporary, 'deck');
    const created = await initDeck({
      title: 'AI Agent Platform',
      format,
      destination,
    });

    assert.equal(created.format, format);
    const result = await checkDeck(destination);
    assert.equal(result.ok, true, JSON.stringify(result, null, 2));
    assert.ok(result.metrics.slides >= 5);
  });
}

test('initDeck refuses to overwrite a non-empty directory without force', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'claude-slides-force-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));

  const destination = path.join(temporary, 'deck');
  await initDeck({ title: 'First deck', format: 'html', destination });

  await assert.rejects(
    () => initDeck({ title: 'Second deck', format: 'html', destination }),
    /Destination is not empty/,
  );

  await initDeck({ title: 'Second deck', format: 'html', destination, force: true });
  const html = await readFile(path.join(destination, 'index.html'), 'utf8');
  assert.match(html, /Second deck/);
});

test('generated HTML replaces title tokens in the runtime', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'claude-slides-token-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));

  const destination = path.join(temporary, 'deck');
  await initDeck({ title: 'Token Test', format: 'html', destination });
  const runtime = await readFile(path.join(destination, 'slides.js'), 'utf8');
  assert.match(runtime, /Token Test/);
  assert.doesNotMatch(runtime, /\{\{TITLE\}\}/);
});

test('checkDeck reports missing local assets', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'claude-slides-broken-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));

  const destination = path.join(temporary, 'deck');
  await initDeck({ title: 'Broken deck', format: 'html', destination });
  const htmlPath = path.join(destination, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  await writeFile(htmlPath, html.replace('slides.js', 'missing.js'), 'utf8');

  const result = await checkDeck(destination);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((finding) => finding.code === 'missing-asset'));
});

test('checkDeck reports accessibility and runtime warnings', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'claude-slides-check-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  await mkdir(path.join(directory, 'assets'));
  await writeFile(
    path.join(directory, 'index.html'),
    '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><section class="slide" id="same"><h1>A</h1><img src="data:image/png;base64,x"></section><section class="slide" id="same"><h2>B</h2></section></body></html>',
  );

  const result = await checkDeck(directory);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'duplicate-id'));
  assert.ok(result.warnings.some((item) => item.code === 'alt-text'));
  assert.ok(result.warnings.some((item) => item.code === 'keyboard-navigation'));
  assert.ok(result.warnings.some((item) => item.code === 'hash-navigation'));
  assert.ok(result.warnings.some((item) => item.code === 'print-css'));
  assert.ok(result.warnings.some((item) => item.code === 'reduced-motion'));
});
