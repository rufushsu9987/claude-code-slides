import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { initDeck } from '../lib/runtime.mjs';

const catalog = JSON.parse(await readFile(new URL('../templates/catalog.json', import.meta.url), 'utf8'));

function luminance(hex) {
  const channels = [1, 3, 5]
    .map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function finalCssVariable(css, name) {
  const values = [...css.matchAll(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'gi'))];
  assert.ok(values.length > 0, `missing --${name}`);
  return values.at(-1)[1];
}

test('theme accent colors meet normal-text contrast against primary surfaces', () => {
  for (const theme of catalog.templates) {
    assert.ok(
      contrast(theme.palette.accent, theme.palette.canvas) >= 4.5,
      `${theme.name} accent/canvas contrast`,
    );
    assert.ok(
      contrast(theme.palette.accent, theme.palette.surface) >= 4.5,
      `${theme.name} accent/surface contrast`,
    );
  }
});

test('shared starter SVG assets stay identical across output formats', async () => {
  const names = [
    'data-journey.svg',
    'decision-path.svg',
    'infographic-story.svg',
    'operating-loop.svg',
    'system-map.svg',
  ];
  for (const name of names) {
    const [html, marp, pptx] = await Promise.all(
      ['html', 'marp', 'pptx'].map((format) =>
        readFile(new URL(`../templates/${format}/assets/${name}`, import.meta.url)),
      ),
    );
    assert.equal(html.equals(marp), true, `${name} HTML/Marp drift`);
    assert.equal(html.equals(pptx), true, `${name} HTML/PPTX drift`);
  }
});

test('scaffolded SVG assets receive the selected theme palette', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'claude-slides-theme-assets-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  await initDeck({
    title: 'Executive asset palette',
    format: 'html',
    template: 'executive-brief',
    destination: directory,
  });

  const svg = await readFile(path.join(directory, 'assets', 'system-map.svg'), 'utf8');
  assert.doesNotMatch(svg, /\{\{[A-Z0-9_]+\}\}/);
  assert.match(svg, /#2E63D3/i);
  assert.doesNotMatch(svg, /#(?:D97757|AD563A)/i);
});

test('generated theme text tokens remain readable on accent and terminal fills', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'claude-slides-theme-contrast-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  for (const theme of catalog.templates) {
    const target = path.join(directory, theme.name);
    await initDeck({
      title: `${theme.displayName} contrast`,
      format: 'html',
      template: theme.name,
      destination: target,
    });
    const css = await readFile(path.join(target, 'theme.css'), 'utf8');
    const accentForeground = finalCssVariable(css, 'accent-foreground');
    const terminalAccent = finalCssVariable(css, 'terminal-accent');
    const successText = finalCssVariable(css, 'success-text');
    assert.ok(
      contrast(accentForeground, theme.palette.accent) >= 4.5,
      `${theme.name} accent foreground contrast`,
    );
    assert.ok(
      contrast(terminalAccent, theme.palette.code) >= 4.5,
      `${theme.name} terminal accent contrast`,
    );
    assert.ok(
      contrast(successText, theme.palette.code) >= 4.5,
      `${theme.name} terminal success contrast`,
    );
    assert.ok(
      contrast(theme.palette.codeText, theme.palette.code) >= 4.5,
      `${theme.name} closing/code contrast`,
    );
    assert.ok(
      css.lastIndexOf('.slide--closing { background:') >
        css.lastIndexOf('.slide { background:'),
      `${theme.name} closing background must override the preset slide background`,
    );
  }
});

test('Marp preset typography overrides the base heading selector', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'claude-slides-marp-fonts-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await initDeck({
    title: 'Executive typography',
    format: 'marp',
    template: 'executive-brief',
    destination: directory,
  });
  const css = await readFile(path.join(directory, 'theme.css'), 'utf8');
  const presetSelector = css.lastIndexOf('section h1, section h2, section h3');
  assert.ok(presetSelector > css.indexOf('section h1, section h2'));
  const preset = css.slice(presetSelector);
  assert.match(preset, /font-family: var\(--font-display\)/);
  assert.match(preset, /\.proof-rail strong,[\s\S]*font-family: var\(--font-display\)/);
  assert.match(preset, /\.terminal pre,[\s\S]*font-family: var\(--font-mono\)/);
  assert.match(css, /--font-display: "Aptos Display"/);
});

test('dark theme uses palette-aware panels and semantic foregrounds in every format', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'claude-slides-dark-theme-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  for (const format of ['html', 'marp', 'pptx']) {
    const target = path.join(directory, format);
    await initDeck({
      title: 'Dark theme audit',
      format,
      template: 'dark-terminal',
      destination: target,
    });
    const filename = format === 'html' ? 'theme.css' : format === 'marp' ? 'theme.css' : 'deck.mjs';
    const source = await readFile(path.join(target, filename), 'utf8');
    assert.doesNotMatch(source, /(?:EFEBE4|F2EEE7|#efebe4|#f2eee7)/i);
    if (format === 'pptx') {
      assert.match(source, /accentText:\s*"[0-9A-F]{6}"/);
      assert.doesNotMatch(source, /C\.white/);
    } else {
      assert.match(source, /--accent-foreground:\s*#[0-9A-F]{6}/i);
      assert.match(source, /--terminal-accent:\s*#[0-9A-F]{6}/i);
      assert.match(source, /--success-text:\s*#[0-9A-F]{6}/i);
    }
  }
});
