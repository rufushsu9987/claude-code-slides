import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(await readFile(new URL('../templates/catalog.json', import.meta.url), 'utf8'));
const layouts = JSON.parse(await readFile(new URL('../templates/layouts.json', import.meta.url), 'utf8'));
const starterSequence = ['editorial-cover','hero-statement','before-after','layered-architecture','flow-architecture','metric-spotlight','evidence-claim','infographic-story','data-journey','code-walkthrough','comparison-matrix','decision-path','timeline','risk-matrix','closing-manifesto'];

test('template catalog is unique, complete, and portable', () => {
  assert.equal(catalog.version, 2);
  assert.equal(catalog.default, 'claude-editorial');
  assert.equal(catalog.layoutCatalog, 'layouts.json');
  assert.ok(Array.isArray(catalog.templates));
  assert.ok(catalog.templates.length >= 7);
  const names = catalog.templates.map((template) => template.name);
  const aliases = catalog.templates.flatMap((template) => template.aliases || []);
  assert.equal(new Set([...names, ...aliases]).size, names.length + aliases.length);
  assert.ok(names.includes(catalog.default));
  const defaultTemplate = catalog.templates.find((template) => template.name === catalog.default);
  assert.ok(defaultTemplate.aliases.includes('terminal-editorial'));
  for (const template of catalog.templates) {
    assert.match(template.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(template.displayName);
    assert.ok(template.description);
    assert.deepEqual(template.formats, ['html', 'marp', 'pptx']);
    assert.ok(['light', 'dark'].includes(template.mode));
    assert.ok(template.pattern);
    assert.equal(template.layoutSystem, layouts.name);
    assert.ok(template.useCases.length >= 2);
    for (const alias of template.aliases || []) assert.match(alias, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const value of Object.values(template.palette)) assert.match(value, /^#[0-9A-F]{6}$/);
    for (const key of ['cssDisplay','cssBody','cssMono','pptxDisplay','pptxBody','pptxMono']) assert.ok(template.fonts[key]);
  }
});

test('layout catalog defines a diverse content-aware design system', () => {
  assert.equal(layouts.version, 1);
  assert.equal(layouts.name, 'claude-editorial-layout-system');
  assert.ok(layouts.archetypes.length >= 19);
  assert.deepEqual(layouts.starterSequence, starterSequence);
  assert.ok(layouts.rules.minimumUniqueForTenSlides >= 8);
  assert.equal(layouts.rules.maximumConsecutiveSame, 1);
  assert.ok(layouts.rules.maximumCardShare <= 0.2);
  assert.ok(layouts.rules.rhythmChangeEvery <= 4);
  const names = layouts.archetypes.map((layout) => layout.name);
  assert.equal(new Set(names).size, names.length);
  for (const layout of layouts.archetypes) {
    assert.match(layout.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(layout.family);
    assert.ok(layout.description);
    assert.ok(layout.bestFor.length >= 2);
    assert.deepEqual(layout.formats, ['html', 'marp', 'pptx']);
  }
});

test('starter decks demonstrate fifteen distinct layout archetypes', async () => {
  const [html, marp, pptx] = await Promise.all([
    readFile(new URL('../templates/html/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../templates/marp/deck.md', import.meta.url), 'utf8'),
    readFile(new URL('../templates/pptx/deck.mjs', import.meta.url), 'utf8'),
  ]);
  const htmlLayouts = [...html.matchAll(/data-layout="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(htmlLayouts, starterSequence);
  const marpLayouts = [...marp.matchAll(/<!-- _class: ([a-z0-9-]+) -->/g)].map((match) => match[1]);
  assert.deepEqual(marpLayouts, starterSequence);
  const sequenceBlock = pptx.match(/const LAYOUT_SEQUENCE = Object\.freeze\(\[([\s\S]*?)\]\);/);
  assert.ok(sequenceBlock);
  const pptxLayouts = [...sequenceBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(pptxLayouts, starterSequence);
  assert.equal((pptx.match(/\.addSlide\s*\(/g) || []).length, starterSequence.length);
});
