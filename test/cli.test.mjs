import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  VERSION,
  checkDeck,
  doctor,
  initDeck,
  listLayouts,
  main,
  listTemplates,
  slugify,
} from '../lib/cli.mjs';

test('doctor accepts Node.js 18+ and reports both agent CLIs', async () => {
  const result = doctor();
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(result.node.available, Number(process.versions.node.split('.')[0]) >= 18);
  assert.ok('codex' in result);
  assert.ok('claude' in result);
  assert.equal(VERSION, packageJson.version);
});

test('slugify creates stable portable identifiers', () => {
  assert.equal(slugify('AI Agent Platform 2026'), 'ai-agent-platform-2026');
  assert.equal(slugify('  Cloud / Native  '), 'cloud-native');
  assert.equal(slugify('企業 AI 平台'), '企業-ai-平台');
  assert.equal(slugify('---'), 'presentation');
});

test('template and layout discovery expose the Claude Editorial defaults', async () => {
  const templates = await listTemplates();
  assert.equal(templates.default, 'claude-editorial');
  const defaultTemplate = templates.templates.find((template) => template.isDefault);
  assert.equal(defaultTemplate.name, 'claude-editorial');
  assert.ok(defaultTemplate.aliases.includes('terminal-editorial'));

  const layouts = await listLayouts();
  assert.equal(layouts.archetypes.length >= 16, true);
  assert.equal(layouts.starterSequence.length, 12);
  assert.equal(new Set(layouts.starterSequence).size, layouts.starterSequence.length);

  const systemLayouts = await listLayouts({ family: 'system' });
  assert.deepEqual(
    systemLayouts.archetypes.map((layout) => layout.name).sort(),
    ['flow-architecture', 'layered-architecture'],
  );
});

for (const format of ['html', 'marp', 'pptx']) {
  test(`initDeck scaffolds and validates ${format} with the default layout system`, async (t) => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), `code-slides-${format}-`));
    t.after(() => rm(temporary, { recursive: true, force: true }));

    const destination = path.join(temporary, 'deck');
    const created = await initDeck({ title: 'AI Agent Platform', format, destination });

    assert.equal(created.format, format);
    assert.equal(created.template, 'claude-editorial');
    const result = await checkDeck(destination);
    assert.equal(result.ok, true, JSON.stringify(result, null, 2));
    assert.ok(result.metrics.slides >= 12);

    const metadata = JSON.parse(await readFile(path.join(destination, 'template.json'), 'utf8'));
    assert.equal(metadata.name, 'claude-editorial');
    assert.equal(metadata.layoutSystem.starterSequence.length, 12);
    assert.ok(metadata.layoutSystem.archetypes.length >= 16);
  });
}

test('legacy terminal-editorial template name resolves to claude-editorial', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'code-slides-alias-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));

  const destination = path.join(temporary, 'deck');
  const created = await initDeck({
    title: 'Compatibility deck',
    format: 'html',
    template: 'terminal-editorial',
    destination,
  });
  assert.equal(created.template, 'claude-editorial');
  const metadata = JSON.parse(await readFile(path.join(destination, 'template.json'), 'utf8'));
  assert.equal(metadata.name, 'claude-editorial');
  assert.ok(metadata.aliases.includes('terminal-editorial'));
});

test('initDeck refuses to overwrite a non-empty directory without force', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'code-slides-force-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const destination = path.join(temporary, 'deck');
  await initDeck({ title: 'First deck', format: 'html', destination });
  await assert.rejects(() => initDeck({ title: 'Second deck', format: 'html', destination }), /Destination is not empty/);
  await initDeck({ title: 'Second deck', format: 'html', destination, force: true });
  const html = await readFile(path.join(destination, 'index.html'), 'utf8');
  assert.match(html, /Second deck/);
});

test('generated HTML replaces title tokens in the runtime', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'code-slides-token-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const destination = path.join(temporary, 'deck');
  await initDeck({ title: 'Token Test', format: 'html', destination });
  const runtime = await readFile(path.join(destination, 'slides.js'), 'utf8');
  assert.match(runtime, /Token Test/);
  assert.doesNotMatch(runtime, /\{\{TITLE\}\}/);
});

test('checkDeck reports repetitive layout sequences', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'code-slides-layout-repeat-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await initDeck({ title: 'Repetitive deck', format: 'html', destination: temporary });
  const htmlPath = path.join(temporary, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  await writeFile(htmlPath, html.replaceAll(/data-layout="[^"]+"/g, 'data-layout="flow-architecture"'), 'utf8');
  const result = await checkDeck(temporary);
  assert.equal(result.ok, true);
  for (const code of ['layout-repeat', 'layout-diversity', 'layout-card-share', 'layout-family-rhythm']) {
    assert.ok(result.warnings.some((finding) => finding.code === code), code);
  }
});

test('checkDeck reports missing local assets', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'code-slides-broken-'));
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
  const directory = await mkdtemp(path.join(os.tmpdir(), 'code-slides-check-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'assets'));
  await writeFile(path.join(directory, 'index.html'), '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><section class="slide" id="same"><h1>A</h1><img src="data:image/png;base64,x"></section><section class="slide" id="same"><h2>B</h2></section></body></html>');
  const result = await checkDeck(directory);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === 'duplicate-id'));
  assert.ok(result.warnings.some((item) => item.code === 'alt-text'));
  assert.ok(result.warnings.some((item) => item.code === 'keyboard-navigation'));
  assert.ok(result.warnings.some((item) => item.code === 'hash-navigation'));
  assert.ok(result.warnings.some((item) => item.code === 'print-css'));
  assert.ok(result.warnings.some((item) => item.code === 'reduced-motion'));
});

test('promo command exposes the unified pipeline help', async () => {
  let output = '';
  const io = { stdout: { write: (value) => { output += value; } }, stderr: { write: () => {} } };
  const code = await main(['promo', 'help'], io);
  assert.equal(code, 0);
  assert.match(output, /promo run <repository-path>/);
  assert.match(output, /--capture/);
});

test('promo command runs the deterministic intake stage and records skipped stages', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'code-slides-promo-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  let output = '';
  const io = { stdout: { write: (value) => { output += value; } }, stderr: { write: () => {} } };
  const code = await main(['promo', 'run', 'test/fixtures/promo-source', '--out', temporary, '--json'], io);
  assert.equal(code, 0);
  const result = JSON.parse(output);
  assert.equal(result.status, 'PARTIAL');
  assert.equal(result.stages.intake.status, 'completed');
  assert.equal(result.stages.narration.status, 'skipped');
  assert.match(await readFile(path.join(temporary, 'project-facts.json'), 'utf8'), /demo-project/);
  assert.match(await readFile(path.join(temporary, 'pipeline-status.json'), 'utf8'), /manual-approval-required/);
});
