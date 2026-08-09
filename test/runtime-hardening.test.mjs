import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, link, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkDeck, initDeck, main } from '../lib/cli.mjs';

const specialTitle = 'O\'Brien `launch` ${owner} "</title><script>boom()</script>"\n繁體中文';

function memoryIo() {
  let output = '';
  return {
    stdout: { write(value) { output += value; } },
    stderr: { write() {} },
    read() { return output; },
  };
}

function assertValidJavaScript(file) {
  const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
}

async function makeTemporary(t, label) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), `code-slides-${label}-`));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  return temporary;
}

test('HTML scaffolding encodes titles by context and records a canonical language', async (t) => {
  const temporary = await makeTemporary(t, 'html-encoding');
  const destination = path.join(temporary, 'deck');
  const created = await initDeck({
    title: specialTitle,
    format: 'html',
    destination,
    language: 'zh-tw',
  });

  assert.equal(created.title, specialTitle);
  assert.equal(created.language, 'zh-TW');

  const html = await readFile(path.join(destination, 'index.html'), 'utf8');
  assert.match(html, /<html lang="zh-TW">/);
  assert.match(html, /O'Brien `launch` \$&#123;owner&#125;/);
  assert.match(html, /&quot;&lt;\/title&gt;&lt;script&gt;boom\(\)&lt;\/script&gt;&quot;&#10;繁體中文 presentation/);
  assert.doesNotMatch(html, /<script>boom\(\)<\/script>/);
  assert.doesNotMatch(html, /\{\{TITLE(?:\}|_)/);

  const runtime = await readFile(path.join(destination, 'slides.js'), 'utf8');
  assert.match(runtime, /const deckTitle = "O'Brien `launch` \$\\u007Bowner\\u007D/);
  assert.match(runtime, /\\u003C\/title\\u003E\\u003Cscript\\u003Eboom\(\)\\u003C\/script\\u003E/);
  assert.match(runtime, /\\n繁體中文";/);
  assert.doesNotMatch(runtime, /<script>boom\(\)<\/script>/);
  assertValidJavaScript(path.join(destination, 'slides.js'));

  const readme = await readFile(path.join(destination, 'README.md'), 'utf8');
  assert.match(readme, /O'Brien \\`launch\\` \$\\\{owner\\\}/);
  assert.match(readme, /&lt;script&gt;boom\\\(\\\)&lt;\/script&gt;/);
  assert.match(readme, /<br>繁體中文/);
  assert.match(readme, /\(`claude-editorial`\)/);
  assert.match(readme, /Language: `zh-TW`\./);

  const metadata = JSON.parse(await readFile(path.join(destination, 'template.json'), 'utf8'));
  assert.equal(metadata.language, 'zh-TW');
  assert.equal(typeof metadata.pluginVersion, 'string');
  assert.equal(typeof metadata.templateCatalogVersion, 'number');
  assert.equal(typeof metadata.layoutCatalogVersion, 'number');
});

test('Marp scaffolding uses quoted YAML and single-line escaped Markdown for hostile titles', async (t) => {
  const temporary = await makeTemporary(t, 'marp-encoding');
  const destination = path.join(temporary, 'deck');
  await initDeck({ title: specialTitle, format: 'marp', destination, language: 'zh-TW' });

  const markdown = await readFile(path.join(destination, 'deck.md'), 'utf8');
  assert.match(markdown, /^lang: "zh-TW"$/m);
  assert.match(markdown, /^footer: /m);
  assert.match(markdown, /\\u0026lt;\/title\\u0026gt;\\u0026lt;script\\u0026gt;boom/);
  assert.match(markdown, /^# O'Brien \\`launch\\` \$\\\{owner\\\}/m);
  assert.match(markdown, /&lt;\/title&gt;&lt;script&gt;boom\\\(\\\)&lt;\/script&gt;/);
  assert.match(markdown, /<br>繁體中文/);
  assert.doesNotMatch(markdown, /<script>boom\(\)<\/script>/);
  assert.doesNotMatch(markdown, /\{\{TITLE(?:\}|_)/);
});

test('PPTX scaffolding emits valid JavaScript strings, locale metadata, and themed assets', async (t) => {
  const temporary = await makeTemporary(t, 'pptx-encoding');
  const destination = path.join(temporary, 'deck');
  await initDeck({ title: specialTitle, format: 'pptx', destination, language: 'zh-tw' });

  const deckPath = path.join(destination, 'deck.mjs');
  const source = await readFile(deckPath, 'utf8');
  assert.match(source, /const deckTitle = "O'Brien `launch` \$\\u007Bowner\\u007D/);
  assert.match(source, /const deckLanguage = "zh-TW";/);
  assert.match(source, /pptx\.lang = deckLanguage;/);
  assert.match(source, /lang: deckLanguage/);
  assert.match(source, /\\u003Cscript\\u003Eboom\(\)\\u003C\/script\\u003E/);
  assert.doesNotMatch(source, /<script>boom\(\)<\/script>/);
  assert.doesNotMatch(source, /\{\{[A-Z][A-Z0-9_]*\}\}/);
  assertValidJavaScript(deckPath);

  const catalog = JSON.parse(await readFile(new URL('../templates/catalog.json', import.meta.url), 'utf8'));
  const selected = catalog.templates.find((item) => item.name === catalog.default);
  assert.match(source, new RegExp(`accent: "${selected.palette.accent.slice(1).toUpperCase()}"`));

  const svg = await readFile(path.join(destination, 'assets', 'system-map.svg'), 'utf8');
  assert.match(svg, new RegExp(selected.palette.accent.replace('#', '\\#')));
  assert.doesNotMatch(svg, /\{\{[A-Z][A-Z0-9_]*\}\}/);

  const metadata = JSON.parse(await readFile(path.join(destination, 'template.json'), 'utf8'));
  assert.equal(metadata.language, 'zh-TW');
});

test('language defaults to en-US, stays consistent in HTML, and rejects invalid tags', async (t) => {
  const temporary = await makeTemporary(t, 'language');
  const destination = path.join(temporary, 'default');
  const created = await initDeck({ title: 'Default language', format: 'html', destination });
  assert.equal(created.language, 'en-US');

  const html = await readFile(path.join(destination, 'index.html'), 'utf8');
  assert.match(html, /<html lang="en-US">/);
  const metadata = JSON.parse(await readFile(path.join(destination, 'template.json'), 'utf8'));
  assert.equal(metadata.language, 'en-US');

  await assert.rejects(
    () => initDeck({
      title: 'Invalid language',
      format: 'html',
      destination: path.join(temporary, 'invalid'),
      language: 'not_a_locale',
    }),
    /Invalid language tag/,
  );

  const darkDestination = path.join(temporary, 'dark');
  await initDeck({
    title: 'Dark metadata',
    format: 'html',
    template: 'dark-terminal',
    destination: darkDestination,
  });
  const darkHtml = await readFile(path.join(darkDestination, 'index.html'), 'utf8');
  assert.match(darkHtml, /<meta name="color-scheme" content="dark" \/>/);
});

test('token-like title text is not interpreted as a second replacement pass', async (t) => {
  const temporary = await makeTemporary(t, 'single-pass');
  const destination = path.join(temporary, 'deck');
  await initDeck({
    title: 'Literal {{SLUG}} and {{ACCENT}}',
    format: 'html',
    destination,
  });

  const [html, runtime] = await Promise.all([
    readFile(path.join(destination, 'index.html'), 'utf8'),
    readFile(path.join(destination, 'slides.js'), 'utf8'),
  ]);
  assert.match(html, /Literal &#123;&#123;SLUG&#125;&#125; and &#123;&#123;ACCENT&#125;&#125;/);
  assert.match(runtime, /"Literal \\u007B\\u007BSLUG\\u007D\\u007D and \\u007B\\u007BACCENT\\u007D\\u007D"/);
  const validation = await checkDeck(destination, { strict: true });
  assert.ok(!validation.warnings.some((finding) => /SLUG|ACCENT/.test(finding.message)));
});

test('initDeck rejects destinations equal to, inside, or symlinked to a template source', async (t) => {
  const temporary = await makeTemporary(t, 'source-overlap');
  const source = fileURLToPath(new URL('../templates/html', import.meta.url));
  const nested = path.join(source, '__runtime-hardening-must-not-exist__');

  await assert.rejects(
    () => initDeck({ title: 'Unsafe', format: 'html', destination: source, force: true }),
    /overlaps the template source/,
  );
  await assert.rejects(
    () => initDeck({ title: 'Unsafe', format: 'html', destination: nested, force: true }),
    /overlaps the template source/,
  );
  await assert.rejects(access(nested), /ENOENT/);

  const linked = path.join(temporary, 'linked-template');
  await symlink(source, linked, 'dir');
  await assert.rejects(
    () => initDeck({ title: 'Unsafe', format: 'html', destination: linked, force: true }),
    /overlaps the template source/,
  );
});

test('force mode rejects generated paths that are symbolic links', async (t) => {
  const temporary = await makeTemporary(t, 'force-symlink');
  const destination = path.join(temporary, 'deck');
  const outside = path.join(temporary, 'outside');
  await initDeck({ title: 'Original', format: 'html', destination });
  await rm(path.join(destination, 'template.json'));
  await symlink(outside, path.join(destination, 'template.json'));

  await assert.rejects(
    () => initDeck({ title: 'Replacement', format: 'html', destination, force: true }),
    /symbolic link at a generated path/,
  );
  await assert.rejects(access(outside), /ENOENT/);
  assert.match(await readFile(path.join(destination, 'index.html'), 'utf8'), /Original/);

  const assetDestination = path.join(temporary, 'asset-deck');
  const outsideAssets = path.join(temporary, 'outside-assets');
  await initDeck({ title: 'Asset original', format: 'html', destination: assetDestination });
  await rm(path.join(assetDestination, 'assets'), { recursive: true });
  await mkdir(outsideAssets);
  await symlink(outsideAssets, path.join(assetDestination, 'assets'), 'dir');
  await assert.rejects(
    () => initDeck({ title: 'Asset replacement', format: 'html', destination: assetDestination, force: true }),
    /symbolic link at a generated path/,
  );
  assert.deepEqual(await readdir(outsideAssets), []);

  const hardLinkDestination = path.join(temporary, 'hard-link-deck');
  const victim = path.join(temporary, 'victim.json');
  await initDeck({ title: 'Hard link original', format: 'html', destination: hardLinkDestination });
  await writeFile(victim, 'do not overwrite');
  await rm(path.join(hardLinkDestination, 'template.json'));
  await link(victim, path.join(hardLinkDestination, 'template.json'));
  await assert.rejects(
    () => initDeck({ title: 'Hard link replacement', format: 'html', destination: hardLinkDestination, force: true }),
    /must not be a hard link/,
  );
  assert.equal(await readFile(victim, 'utf8'), 'do not overwrite');
});

test('copyable next commands quote hostile destination paths for POSIX shells', async (t) => {
  const temporary = await makeTemporary(t, 'shell-quote');
  const segment = "deck-$(printf INJECTED)-`printf BT`-O'Brien";
  const destination = path.join(temporary, segment);
  const created = await initDeck({ title: 'Shell-safe next step', format: 'pptx', destination });

  assert.match(created.next, /^Run: cd '/);
  assert.match(created.next, /'\\''/);
  const cdCommand = created.next.slice('Run: '.length).split(' && ', 1)[0];
  const probe = spawnSync('/bin/sh', ['-c', `${cdCommand} && pwd`], { encoding: 'utf8' });
  assert.equal(probe.status, 0, probe.stderr || probe.stdout);
  assert.equal(path.resolve(probe.stdout.trim()), path.resolve(destination));
});

test('CLI strictly separates boolean and value options without overwriting on --force=false', async (t) => {
  const temporary = await makeTemporary(t, 'strict-cli');
  const destination = path.join(temporary, 'existing');
  await initDeck({ title: 'Original title', format: 'html', destination });

  await assert.rejects(
    () => main(['init', 'Replacement title', '--dir', destination, '--force=false'], memoryIo()),
    /--force.*does not take an argument/,
  );
  const html = await readFile(path.join(destination, 'index.html'), 'utf8');
  assert.match(html, /Original title/);
  assert.doesNotMatch(html, /Replacement title/);

  await assert.rejects(() => main(['templates', '--unknown'], memoryIo()), /Unknown option '--unknown'/);
  await assert.rejects(() => main(['templates', '--format'], memoryIo()), /--format.*argument missing/);
  await assert.rejects(() => main(['templates', '--format='], memoryIo()), /requires a non-empty value/);
  await assert.rejects(() => main(['layouts', 'extra'], memoryIo()), /Unexpected positional argument/);
  await assert.rejects(() => main(['check', 'one', 'two'], memoryIo()), /Unexpected positional argument/);
  await assert.rejects(() => main(['init', 'one', 'two'], memoryIo()), /Unexpected positional argument/);
});

test('CLI supports --, --help, language aliases, and strict check options', async (t) => {
  const temporary = await makeTemporary(t, 'cli-options');
  const helpIo = memoryIo();
  assert.equal(await main(['init', '--help'], helpIo), 0);
  assert.match(helpIo.read(), /--lang locale/);

  const dashedDestination = path.join(temporary, 'dashed');
  assert.equal(
    await main(['init', '--dir', dashedDestination, '--lang', 'zh-tw', '--', '--launch'], memoryIo()),
    0,
  );
  assert.match(await readFile(path.join(dashedDestination, 'index.html'), 'utf8'), /<html lang="zh-TW">/);

  const localeDestination = path.join(temporary, 'locale-alias');
  assert.equal(
    await main(['init', 'Locale alias', '--dir', localeDestination, '--locale', 'ja-jp'], memoryIo()),
    0,
  );
  const localeMetadata = JSON.parse(
    await readFile(path.join(localeDestination, 'template.json'), 'utf8'),
  );
  assert.equal(localeMetadata.language, 'ja-JP');

  await assert.rejects(
    () => main(['init', 'Ambiguous', '--lang', 'en-US', '--locale', 'zh-TW'], memoryIo()),
    /either --lang or --locale/,
  );

  const checkIo = memoryIo();
  const exitCode = await main(
    ['check', dashedDestination, '--format', 'html', '--strict', '--json'],
    checkIo,
  );
  assert.ok(exitCode === 0 || exitCode === 1);
  assert.equal(JSON.parse(checkIo.read()).format, 'html');
});
