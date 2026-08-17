import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, truncate, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { initDeck } from '../lib/runtime.mjs';
import { checkDeck } from '../lib/validate.mjs';

function htmlDeck(layouts) {
  const slides = layouts
    .map(
      ({ layout, geometry }, index) =>
        `<section class="slide" data-layout="${layout}"${geometry ? ` data-geometry="${geometry}"` : ''}><h2>Slide ${index + 1}</h2></section>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
  <head><meta name="viewport" content="width=device-width"><title>Test</title></head>
  <body>${slides}</body>
</html>`;
}

function flowMarkup(nodes, transitions = nodes - 1) {
  return `<div class="flow-path">${Array.from({ length: nodes }, (_, index) =>
    `<article class="flow-stop"><span class="flow-index">${index + 1}</span><h3>Step ${index + 1}</h3>${index < transitions ? `<span class="flow-transition">move ${index + 1}</span>` : ''}</article>`
  ).join('')}</div>`;
}

test('fresh scaffolds use only catalog layout archetypes and complete marker sequences', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-scaffold-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));

  for (const format of ['html', 'marp', 'pptx']) {
    const destination = path.join(temporary, format);
    await initDeck({ title: `Catalog ${format}`, format, destination });
    const result = await checkDeck(destination);
    const markerWarnings = result.warnings.filter((finding) =>
      ['layout-archetype', 'layout-marker'].includes(finding.code),
    );
    assert.deepEqual(markerWarnings, [], `${format}: ${JSON.stringify(markerWarnings)}`);
    if (format === 'html') {
      assert.equal(
        result.warnings.some((finding) => finding.code === 'heading'),
        false,
        JSON.stringify(result.warnings),
      );
    }
  }
});

test('catalog diversity rules cover repeats, unique count, card and split share, geometry, and rhythm', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-rules-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const file = path.join(temporary, 'index.html');
  const layouts = [
    ...Array.from({ length: 4 }, () => ({
      layout: 'split-narrative',
      geometry: 'split-screen',
    })),
    ...Array.from({ length: 3 }, () => ({
      layout: 'dashboard-story',
      geometry: 'dashboard-stage',
    })),
    { layout: 'editorial-cover', geometry: 'full-bleed' },
    { layout: 'closing-manifesto', geometry: 'dark-full-bleed' },
    { layout: 'flow-architecture', geometry: 'node-flow' },
  ];
  await writeFile(file, htmlDeck(layouts));

  const result = await checkDeck(file);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  const codes = new Set(result.warnings.map((finding) => finding.code));
  for (const code of [
    'layout-repeat',
    'layout-diversity',
    'layout-card-share',
    'layout-split-share',
    'layout-geometry-run',
    'layout-family-rhythm',
    'layout-rhythm-change',
  ]) {
    assert.ok(codes.has(code), code);
  }

  const strict = await checkDeck(file, { strict: true });
  assert.equal(strict.strict, true);
  assert.equal(strict.ok, false);
  assert.equal(strict.errors.length, 0);
  assert.ok(strict.warnings.length > 0);
});

test('deck-level diversity rules start at 10 slides while unknown markers always report', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-short-layouts-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const file = path.join(temporary, 'index.html');
  await writeFile(
    file,
    htmlDeck(
      Array.from({ length: 9 }, () => ({
        layout: 'split-narrative',
        geometry: 'split-screen',
      })),
    ),
  );

  const shortDeck = await checkDeck(file);
  const diversityCodes = new Set([
    'layout-repeat',
    'layout-diversity',
    'layout-card-share',
    'layout-split-share',
    'layout-geometry-run',
    'layout-family-rhythm',
    'layout-rhythm-change',
  ]);
  assert.deepEqual(
    shortDeck.warnings.filter((finding) => diversityCodes.has(finding.code)),
    [],
  );

  await writeFile(
    file,
    htmlDeck([{ layout: 'not-in-the-catalog', geometry: 'unknown-stage' }]),
  );
  const unknown = await checkDeck(file);
  assert.ok(unknown.warnings.some((finding) => finding.code === 'layout-archetype'));
});

test('missing HTML geometry falls back to the layout catalog for a 10-slide deck', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-geometry-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const file = path.join(temporary, 'index.html');
  await writeFile(
    file,
    htmlDeck(Array.from({ length: 10 }, () => ({ layout: 'split-narrative' }))),
  );

  const result = await checkDeck(file);
  assert.ok(result.warnings.some((finding) => finding.code === 'layout-geometry-run'));
});

test('HTML flow checks catch fixed columns, missing transitions, and excessive density', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-flow-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const file = path.join(temporary, 'index.html');
  const stylesheet = path.join(temporary, 'theme.css');
  const writeDeck = (flow) => writeFile(
    file,
    `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="theme.css"></head><body><section class="slide" data-layout="flow-architecture"><h2>Flow</h2>${flow}</section></body></html>`,
  );

  await writeFile(
    stylesheet,
    '.flow-path { display: grid; grid-template-columns: repeat(4, 1fr); } @media print {} @media (prefers-reduced-motion: reduce) {}',
  );
  await writeDeck(flowMarkup(5, 3));

  const broken = await checkDeck(file);
  const findings = new Map(
    broken.warnings
      .filter((finding) => finding.code.startsWith('flow-'))
      .map((finding) => [finding.code, finding]),
  );
  assert.deepEqual([...findings.keys()].sort(), [
    'flow-column-count',
    'flow-transition-count',
  ]);
  assert.deepEqual(
    { columns: findings.get('flow-column-count').columns, nodes: findings.get('flow-column-count').nodes },
    { columns: 4, nodes: 5 },
  );
  assert.equal(findings.get('flow-transition-count').transitions, 3);
  const strictBroken = await checkDeck(file, { strict: true });
  assert.equal(strictBroken.ok, false);
  assert.equal(strictBroken.errors.length, 0);

  await writeFile(
    stylesheet,
    '.flow-path { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); } @media print {} @media (prefers-reduced-motion: reduce) {}',
  );
  await writeDeck(flowMarkup(7));
  const dense = await checkDeck(file);
  assert.deepEqual(
    dense.warnings
      .filter((finding) => finding.code.startsWith('flow-'))
      .map((finding) => finding.code),
    ['flow-density'],
  );

  await writeDeck(flowMarkup(6));
  const valid = await checkDeck(file);
  assert.deepEqual(
    valid.warnings.filter((finding) => finding.code.startsWith('flow-')),
    [],
  );
});

test('missing layout markers preserve slide adjacency instead of collapsing the sequence', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-marker-hole-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const htmlFile = path.join(temporary, 'index.html');
  await writeFile(
    htmlFile,
    `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body>
<section class="slide" data-layout="editorial-cover"><h2>First</h2></section>
<section class="slide"><h2>Unmarked</h2></section>
<section class="slide" data-layout="editorial-cover"><h2>Third</h2></section>
</body></html>`,
  );

  const html = await checkDeck(htmlFile);
  assert.ok(html.warnings.some((finding) => finding.code === 'layout-marker'));
  assert.ok(!html.warnings.some((finding) => finding.code === 'layout-repeat'));
  assert.equal(html.metrics.layouts, 2);

  const marpFile = path.join(temporary, 'deck.md');
  await writeFile(
    marpFile,
    [
      '---', 'marp: true', 'size: 16:9', 'theme: default', '---',
      '<!-- _class: editorial-cover -->', '# First',
      '---', '# Unmarked',
      '---', '<!-- _class: editorial-cover -->', '# Third',
    ].join('\n'),
  );
  const marp = await checkDeck(marpFile);
  assert.ok(marp.warnings.some((finding) => finding.code === 'layout-marker'));
  assert.ok(!marp.warnings.some((finding) => finding.code === 'layout-repeat'));
  assert.equal(marp.metrics.layouts, 2);
});

test('PPTX GEOMETRY_SEQUENCE overrides catalog geometry for repetition checks', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-pptx-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const file = path.join(temporary, 'deck.mjs');
  await writeFile(
    path.join(temporary, 'package.json'),
    JSON.stringify({ dependencies: { pptxgenjs: '3.12.0' } }),
  );
  const layouts = Array.from({ length: 10 }, (_, index) =>
    index % 2 === 0 ? 'editorial-cover' : 'hero-statement',
  );
  const geometries = Array.from({ length: 10 }, () => 'same-stage');
  const slides = Array.from({ length: 10 }, () => 'pptx.addSlide();').join('\n');
  await writeFile(
    file,
    `import pptxgen from 'pptxgenjs';
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
const LAYOUT_SEQUENCE = Object.freeze(${JSON.stringify(layouts)});
const GEOMETRY_SEQUENCE = Object.freeze(${JSON.stringify(geometries)});
${slides}
await pptx.writeFile({ fileName: 'test.pptx' });
`,
  );

  const result = await checkDeck(file);
  assert.ok(result.warnings.some((finding) => finding.code === 'layout-geometry-run'));
});

test('directory format selection uses metadata or an explicit format and rejects ambiguity', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-format-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await mkdir(temporary, { recursive: true });
  await writeFile(
    path.join(temporary, 'index.html'),
    htmlDeck([{ layout: 'editorial-cover', geometry: 'full-bleed' }]),
  );
  await writeFile(
    path.join(temporary, 'deck.md'),
    ['---', 'marp: true', 'size: 16:9', 'theme: default', '---', '<!-- _class: editorial-cover -->', '# Marp'].join('\n'),
  );

  await assert.rejects(() => checkDeck(temporary), /ambiguous/i);
  assert.equal((await checkDeck(temporary, { format: 'marp' })).format, 'marp');

  await writeFile(path.join(temporary, 'template.json'), JSON.stringify({ format: 'marp' }));
  assert.equal((await checkDeck(temporary)).format, 'marp');
  await assert.rejects(
    () => checkDeck(temporary, { format: 'html' }),
    /conflicts with requested format/i,
  );
  await assert.rejects(
    () => checkDeck(path.join(temporary, 'index.html'), { format: 'pptx' }),
    /conflicts with requested format/i,
  );
});

test('empty Marp has zero slides and mixed fence styles do not create false separators', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-marp-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const file = path.join(temporary, 'deck.md');
  const frontmatter = ['---', 'marp: true', 'size: 16:9', 'theme: default', '---'];
  await writeFile(file, `${frontmatter.join('\n')}\n`);

  const empty = await checkDeck(file);
  assert.equal(empty.metrics.slides, 0);
  assert.equal(empty.ok, false);
  assert.ok(empty.errors.some((finding) => finding.code === 'slides'));

  await writeFile(
    file,
    [
      ...frontmatter,
      '<!-- _class: code-walkthrough -->',
      '# First',
      '```text',
      '---',
      '~~~',
      '```',
      '---',
      '<!-- _class: closing-manifesto -->',
      '# Second',
      '~~~text',
      '---',
      '```',
      '~~~',
    ].join('\n'),
  );

  const mixed = await checkDeck(file);
  assert.equal(mixed.metrics.slides, 2);
  assert.equal(mixed.metrics.layouts, 2);
  assert.ok(!mixed.warnings.some((finding) => finding.code === 'layout-marker'));
});

test('Marp heading validation reports the exact slides without headings', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-headings-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const file = path.join(temporary, 'deck.md');
  await writeFile(
    file,
    [
      '---',
      'marp: true',
      'size: 16:9',
      'theme: default',
      '---',
      '<!-- _class: editorial-cover -->',
      '# First',
      '## Extra heading on the first slide',
      '---',
      '<!-- _class: code-walkthrough -->',
      '```text',
      '# This fenced line is not a slide heading',
      '```',
      '---',
      '<!-- _class: closing-manifesto -->',
      '# Third',
    ].join('\n'),
  );

  const result = await checkDeck(file);
  assert.equal(result.metrics.headings, 3);
  assert.deepEqual(
    result.warnings
      .filter((finding) => finding.code === 'headings')
      .map((finding) => finding.slide),
    [2],
  );
});

test('local asset suffixes resolve safely and external URI forms are ignored case-insensitively', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-uris-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await writeFile(
    path.join(temporary, 'theme.css'),
    '@media print {} @media (prefers-reduced-motion: reduce) {}',
  );
  await writeFile(
    path.join(temporary, 'slides.js'),
    `addEventListener('keydown', () => {}); const keys = ['ArrowRight', 'ArrowLeft']; const size = [innerWidth, innerHeight]; history.replaceState({}, '', location.hash);`,
  );
  await writeFile(path.join(temporary, 'image.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await mkdir(path.join(temporary, 'docs'));
  await writeFile(
    path.join(temporary, 'index.html'),
    `<!doctype html><html lang="en"><head>
<meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="theme.css?cache=1#deck">
</head><body>
<section class="slide" data-layout="editorial-cover"><h1>Safe references</h1>
<img alt="Local" src="image.svg?raw=1#preview">
<img alt="HTTPS" src="HTTPS://example.invalid/image.svg">
<img alt="Protocol relative" src="//cdn.example.invalid/image.svg">
<img alt="Custom scheme" src="CuStOm+Deck://assets/image.svg">
<a href="docs/">Local documentation</a>
</section>
<script src="slides.js?cache=1#runtime"></script>
<script src="HtTp://example.invalid/runtime.js"></script>
</body></html>`,
  );

  const html = await checkDeck(path.join(temporary, 'index.html'));
  assert.deepEqual(html.errors, []);

  await writeFile(
    path.join(temporary, 'deck.md'),
    [
      '---',
      'marp: true',
      'size: 16:9',
      'theme: default',
      '---',
      '<!-- _class: editorial-cover -->',
      '# URI handling',
      '![Local](image.svg?raw=1#preview)',
      '![HTTPS](HTTPS://example.invalid/image.svg)',
      '![Protocol relative](//cdn.example.invalid/image.svg)',
      '![Custom](CuStOm+Deck://assets/image.svg)',
      '![Data](DATA:image/svg+xml;base64,PHN2Zy8+)',
    ].join('\n'),
  );
  const marp = await checkDeck(path.join(temporary, 'deck.md'));
  assert.deepEqual(marp.errors, []);
});

test('local assets reject lexical escapes, realpath escapes, absolute paths, and non-files', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-containment-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const deck = path.join(temporary, 'deck');
  await mkdir(deck);
  const outside = path.join(temporary, 'outside.css');
  await writeFile(outside, '/* outside */');
  await symlink(outside, path.join(deck, 'linked.css'));
  await mkdir(path.join(deck, 'directory.css'));
  await mkdir(path.join(deck, 'directory.js'));
  await writeFile(
    path.join(deck, 'index.html'),
    `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="../outside.css">
<link rel="stylesheet" href="linked.css">
<link rel="stylesheet" href="directory.css">
</head><body><section class="slide" data-layout="editorial-cover"><h1>Unsafe</h1></section>
<script src="/dev/zero?cache=1"></script>
<script src="directory.js#runtime"></script>
</body></html>`,
  );

  const html = await checkDeck(path.join(deck, 'index.html'));
  assert.equal(html.ok, false);
  assert.ok(html.errors.filter((finding) => finding.code === 'unsafe-asset').length >= 3);
  assert.ok(html.errors.filter((finding) => finding.code === 'invalid-asset').length >= 2);

  await mkdir(path.join(deck, 'image.svg'));
  await writeFile(
    path.join(deck, 'deck.md'),
    [
      '---',
      'marp: true',
      'size: 16:9',
      'theme: default',
      '---',
      '<!-- _class: editorial-cover -->',
      '# Invalid image target',
      '![Directory](image.svg?raw=1#preview)',
    ].join('\n'),
  );
  const marp = await checkDeck(path.join(deck, 'deck.md'));
  assert.ok(marp.errors.some((finding) => finding.code === 'invalid-asset'));
});

test('comment-only HTML and PPTX structures do not satisfy structural checks', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-comments-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const htmlFile = path.join(temporary, 'index.html');
  await writeFile(
    htmlFile,
    `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head>
<body><!-- <section class="slide" data-layout="editorial-cover"><h1>Comment</h1></section> --></body></html>`,
  );
  const html = await checkDeck(htmlFile);
  assert.equal(html.metrics.slides, 0);
  assert.ok(html.errors.some((finding) => finding.code === 'slides'));

  const pptxFile = path.join(temporary, 'deck.mjs');
  await writeFile(
    path.join(temporary, 'package.json'),
    JSON.stringify({ dependencies: { pptxgenjs: '3.12.0' } }),
  );
  await writeFile(
    pptxFile,
    `// import pptxgen from 'pptxgenjs';
/*
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
const LAYOUT_SEQUENCE = Object.freeze(['editorial-cover']);
pptx.addSlide();
await pptx.writeFile({ fileName: 'comment.pptx' });
*/
`,
  );
  const pptx = await checkDeck(pptxFile);
  for (const code of ['pptxgenjs', 'aspect-ratio', 'write-file', 'slides']) {
    assert.ok(pptx.errors.some((finding) => finding.code === code), code);
  }
});

test('local CSS, JavaScript, and Marp themes are size-capped before reading', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-size-cap-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const oversized = 10 * 1024 * 1024 + 1;
  for (const name of ['big.css', 'big.js', 'theme.css']) {
    const file = path.join(temporary, name);
    await writeFile(file, '');
    await truncate(file, oversized);
  }
  await writeFile(
    path.join(temporary, 'index.html'),
    `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="big.css"></head><body>
<section class="slide" data-layout="editorial-cover"><h1>Large assets</h1></section>
<script src="big.js"></script></body></html>`,
  );
  const html = await checkDeck(path.join(temporary, 'index.html'));
  assert.deepEqual(
    html.errors
      .filter((finding) => /10 MiB read limit/.test(finding.message))
      .map((finding) => path.basename(finding.message.split(' ')[3]))
      .sort(),
    ['big.css', 'big.js'],
  );

  await writeFile(
    path.join(temporary, 'deck.md'),
    [
      '---',
      'marp: true',
      'size: 16:9',
      'theme: oversized',
      '---',
      '<!-- _class: editorial-cover -->',
      '# Large theme',
    ].join('\n'),
  );
  const marp = await checkDeck(path.join(temporary, 'deck.md'));
  assert.ok(marp.errors.some((finding) => /theme\.css exceeds the 10 MiB/.test(finding.message)));
});

test('TypeScript deck sources are unsupported because the validator cannot parse them', async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'slides-validator-typescript-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const file = path.join(temporary, 'deck.ts');
  await writeFile(file, 'const typed: string = "not JavaScript";');

  await assert.rejects(() => checkDeck(file), /Unsupported deck file/);
  await assert.rejects(() => checkDeck(temporary), /No supported deck entry/);
});
