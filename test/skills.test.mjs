import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const expected = ['claude-code-style','create-deck','deck-architect','deck-reviewer','review-deck','speaker-notes','visual-director'];
const resources = {
  'claude-code-style': ['references/style-system.md'],
  'create-deck': ['references/storytelling.md','references/visual-quality.md','references/style-system.md','references/layout-system.md','references/python-svg-authoring.md','references/python-svg-plan.md','references/output-formats.md','scripts/slides-cli.mjs','scripts/generate-slide-art.py'],
  'deck-architect': ['references/storytelling.md'],
  'deck-reviewer': ['references/review-checklist.md','references/visual-quality.md','references/layout-system.md','references/python-svg-authoring.md','references/python-svg-plan.md','scripts/slides-cli.mjs','scripts/generate-slide-art.py'],
  'review-deck': ['references/review-checklist.md','references/visual-quality.md','references/style-system.md','references/layout-system.md','references/python-svg-authoring.md','references/python-svg-plan.md','references/output-formats.md','scripts/slides-cli.mjs','scripts/generate-slide-art.py'],
  'speaker-notes': [],
  'visual-director': ['references/visual-quality.md','references/style-system.md','references/layout-system.md','references/python-svg-authoring.md','references/python-svg-plan.md','scripts/generate-slide-art.py'],
};
function frontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  assert.ok(match, 'SKILL.md must contain frontmatter');
  return Object.fromEntries(match[1].split('\n').filter((line) => line.includes(':')).map((line) => { const separator = line.indexOf(':'); return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()]; }));
}

async function treeFiles(relativeRoot) {
  const files = [];
  async function visit(relativeDirectory) {
    const entries = await readdir(relativeDirectory, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = path.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) await visit(relativePath);
      else if (entry.isFile()) files.push(relativePath);
    }
  }
  await visit(relativeRoot);
  return files.sort();
}

test('all shared skills use portable metadata and skill-relative resources', async () => {
  const skillDirectories = (await readdir('skills', { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  assert.deepEqual(skillDirectories, expected);
  for (const name of expected) {
    const skillRoot = path.join('skills', name);
    const content = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
    const metadata = frontmatter(content);
    assert.equal(metadata.name, name);
    assert.ok(metadata.description);
    assert.deepEqual(Object.keys(metadata).sort(), ['description', 'name']);
    assert.doesNotMatch(content, /\$ARGUMENTS|argument-hint:|effort:|user-invocable:|CLAUDE_PLUGIN_ROOT|<plugin-root>|claude-code-slides:/);
    assert.doesNotMatch(content, /\.\.\//);
    for (const resource of resources[name]) {
      assert.match(content, new RegExp(resource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      const resourceStat = await stat(path.join(skillRoot, resource));
      assert.equal(resourceStat.isFile(), true);
      if (resource.endsWith('.mjs') || resource.endsWith('.py')) {
        assert.notEqual(resourceStat.mode & 0o111, 0);
      }
    }
    const forwarder = await readFile(path.join('.agents', 'skills', name, 'SKILL.md'), 'utf8');
    const forwarderMetadata = frontmatter(forwarder);
    assert.deepEqual(Object.keys(forwarderMetadata).sort(), ['description', 'name']);
    assert.equal(forwarderMetadata.name, metadata.name);
    assert.equal(forwarderMetadata.description, metadata.description);
    assert.match(forwarder, new RegExp(`\\.\\.\\/\\.\\.\\/\\.\\.\\/skills/${name}/SKILL\\.md`));
  }
});

test('generated skill resources match their canonical sources', async () => {
  const pairs = [
    ['references/python-svg-plan.md','templates/python-svg-plan.md'],
    ['references/storytelling.md','skills/create-deck/references/storytelling.md'],['references/storytelling.md','skills/deck-architect/references/storytelling.md'],
    ['references/visual-quality.md','skills/create-deck/references/visual-quality.md'],['references/visual-quality.md','skills/review-deck/references/visual-quality.md'],['references/visual-quality.md','skills/visual-director/references/visual-quality.md'],['references/visual-quality.md','skills/deck-reviewer/references/visual-quality.md'],
    ['references/style-system.md','skills/create-deck/references/style-system.md'],['references/style-system.md','skills/review-deck/references/style-system.md'],['references/style-system.md','skills/claude-code-style/references/style-system.md'],['references/style-system.md','skills/visual-director/references/style-system.md'],
    ['references/layout-system.md','skills/create-deck/references/layout-system.md'],['references/layout-system.md','skills/review-deck/references/layout-system.md'],['references/layout-system.md','skills/visual-director/references/layout-system.md'],['references/layout-system.md','skills/deck-reviewer/references/layout-system.md'],
    ['references/python-svg-authoring.md','skills/create-deck/references/python-svg-authoring.md'],['references/python-svg-authoring.md','skills/review-deck/references/python-svg-authoring.md'],['references/python-svg-authoring.md','skills/visual-director/references/python-svg-authoring.md'],['references/python-svg-authoring.md','skills/deck-reviewer/references/python-svg-authoring.md'],
    ['references/python-svg-plan.md','skills/create-deck/references/python-svg-plan.md'],['references/python-svg-plan.md','skills/review-deck/references/python-svg-plan.md'],['references/python-svg-plan.md','skills/visual-director/references/python-svg-plan.md'],['references/python-svg-plan.md','skills/deck-reviewer/references/python-svg-plan.md'],
    ['references/output-formats.md','skills/create-deck/references/output-formats.md'],['references/output-formats.md','skills/review-deck/references/output-formats.md'],
    ['references/review-checklist.md','skills/review-deck/references/review-checklist.md'],['references/review-checklist.md','skills/deck-reviewer/references/review-checklist.md'],
    ['scripts/skill-cli-wrapper.mjs','skills/create-deck/scripts/slides-cli.mjs'],['scripts/skill-cli-wrapper.mjs','skills/review-deck/scripts/slides-cli.mjs'],['scripts/skill-cli-wrapper.mjs','skills/deck-reviewer/scripts/slides-cli.mjs'],
    ['scripts/generate-slide-art.py','skills/create-deck/scripts/generate-slide-art.py'],['scripts/generate-slide-art.py','skills/review-deck/scripts/generate-slide-art.py'],['scripts/generate-slide-art.py','skills/visual-director/scripts/generate-slide-art.py'],['scripts/generate-slide-art.py','skills/deck-reviewer/scripts/generate-slide-art.py'],
  ];
  for (const [source, destination] of pairs) {
    const [sourceContent, destinationContent] = await Promise.all([readFile(source), readFile(destination)]);
    assert.equal(destinationContent.equals(sourceContent), true, `${destination} is out of sync`);
  }

  const runtimeSources = [
    'bin/slides.mjs',
    ...(await treeFiles('lib')),
    ...(await treeFiles('templates')),
  ];
  for (const name of ['create-deck', 'review-deck', 'deck-reviewer']) {
    for (const source of runtimeSources) {
      const canonical = source === 'templates/python-svg-plan.md'
        ? 'references/python-svg-plan.md'
        : source;
      const destination = path.join('skills', name, 'runtime', source);
      const [sourceContent, destinationContent] = await Promise.all([
        readFile(canonical),
        readFile(destination),
      ]);
      assert.equal(destinationContent.equals(sourceContent), true, `${destination} is out of sync`);
    }
  }
});

test('portable skill bundles remain self-contained outside the repository', async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'claude-code-slides-skills-'));
  try {
    for (const name of expected) {
      const isolatedRoot = path.join(temporaryRoot, name);
      await cp(path.join('skills', name), isolatedRoot, { recursive: true });

      const markdownFiles = ['SKILL.md'];
      try {
        const references = await readdir(path.join(isolatedRoot, 'references'));
        markdownFiles.push(
          ...references
            .filter((entry) => entry.endsWith('.md'))
            .map((entry) => path.join('references', entry)),
        );
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      const discoveredResources = new Set(resources[name]);
      for (const markdownFile of markdownFiles) {
        const content = await readFile(path.join(isolatedRoot, markdownFile), 'utf8');
        for (const match of content.matchAll(/\b(?:references|scripts)\/[A-Za-z0-9._/-]+/g)) {
          if (match[0].includes('...')) continue;
          const resource = match[0].replace(/[.,;:]+$/, '');
          discoveredResources.add(resource);
        }
      }

      for (const resource of discoveredResources) {
        const target = path.resolve(isolatedRoot, resource);
        assert.ok(target.startsWith(`${path.resolve(isolatedRoot)}${path.sep}`));
        const resourceStat = await stat(target);
        assert.equal(resourceStat.isFile(), true, `${name} is missing ${resource}`);
      }
    }

    const callerRoot = path.join(temporaryRoot, 'external-caller');
    await mkdir(callerRoot);
    for (const name of ['create-deck', 'review-deck', 'deck-reviewer']) {
      const wrapper = path.join(temporaryRoot, name, 'scripts', 'slides-cli.mjs');
      const { stdout } = await execFileAsync(
        process.execPath,
        [wrapper, 'templates', '--json'],
        { cwd: callerRoot },
      );
      const result = JSON.parse(stdout);
      assert.equal(result.default, 'claude-editorial');
      assert.ok(result.templates.length > 0);
    }

    const createWrapper = path.join(
      temporaryRoot,
      'create-deck',
      'scripts',
      'slides-cli.mjs',
    );
    await execFileAsync(
      process.execPath,
      [
        createWrapper,
        'init',
        'Portable Runtime',
        '--format',
        'html',
        '--dir',
        'portable-runtime',
      ],
      { cwd: callerRoot },
    );
    const deckRoot = path.join(callerRoot, 'portable-runtime');
    assert.equal((await stat(path.join(deckRoot, 'index.html'))).isFile(), true);
    const { stdout: checkOutput } = await execFileAsync(
      process.execPath,
      [createWrapper, 'check', deckRoot, '--format', 'html', '--json'],
      { cwd: callerRoot },
    );
    assert.equal(JSON.parse(checkOutput).ok, true);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('Python SVG authoring links to the colocated canonical plan', async () => {
  const authoringFiles = [
    'references/python-svg-authoring.md',
    ...['create-deck', 'review-deck', 'visual-director', 'deck-reviewer'].map(
      (name) => `skills/${name}/references/python-svg-authoring.md`,
    ),
  ];
  for (const authoringFile of authoringFiles) {
    const content = await readFile(authoringFile, 'utf8');
    assert.match(content, /\]\(python-svg-plan\.md\)/, authoringFile);
    const linkedPlan = path.join(path.dirname(authoringFile), 'python-svg-plan.md');
    assert.equal((await stat(linkedPlan)).isFile(), true, linkedPlan);
  }
});

test('portable commands resolve helpers absolutely without changing user cwd', async () => {
  for (const name of ['create-deck', 'review-deck', 'deck-reviewer']) {
    const content = await readFile(path.join('skills', name, 'SKILL.md'), 'utf8');
    assert.match(content, /<absolute-skill-dir>\/scripts\/slides-cli\.mjs/);
    assert.match(content, /shell working directory/i);
    assert.doesNotMatch(content, /\bnode\s+["']?scripts\/slides-cli\.mjs/);
  }

  const protocol = await readFile('references/python-svg-authoring.md', 'utf8');
  assert.match(protocol, /<absolute-skill-dir>\/references\/python-svg-plan\.md/);
  assert.match(protocol, /<absolute-skill-dir>\/scripts\/generate-slide-art\.py/);
  assert.doesNotMatch(protocol, /templates\/python-svg-plan\.md/);
});

test('general visual guidance is brand-neutral and Claude styling is opt-in', async () => {
  const [visualQuality, styleSystem, createDeck, reviewDeck, visualDirector, claudeStyle] =
    await Promise.all([
      readFile('references/visual-quality.md', 'utf8'),
      readFile('references/style-system.md', 'utf8'),
      readFile('skills/create-deck/SKILL.md', 'utf8'),
      readFile('skills/review-deck/SKILL.md', 'utf8'),
      readFile('skills/visual-director/SKILL.md', 'utf8'),
      readFile('skills/claude-code-style/SKILL.md', 'utf8'),
    ]);

  assert.doesNotMatch(visualQuality, /Claude|Anthropic|terracotta/i);
  assert.match(styleSystem, /#AD563A/);
  for (const content of [createDeck, reviewDeck, visualDirector]) {
    assert.match(content, /references\/visual-quality\.md/);
    assert.match(content, /style-system\.md[\s\S]*only when/i);
    assert.match(content, /claude-editorial/);
  }
  assert.match(frontmatter(claudeStyle).description, /Use only when/i);
  assert.doesNotMatch(frontmatter(claudeStyle).description, /unless another brand/i);
});

test('portable deck workflows explicitly enforce layout diversity', async () => {
  const contents = await Promise.all(['skills/create-deck/SKILL.md','skills/visual-director/SKILL.md','skills/review-deck/SKILL.md','skills/deck-reviewer/SKILL.md'].map((file) => readFile(file, 'utf8')));
  for (const content of contents) {
    assert.match(content, /layout archetype|archetypes/i);
    assert.match(content, /consecutive/i);
    assert.match(content, /20%/);
  }
});

test('cover guidance prefers meaningful evidence or whitespace over decorative right-side filler', async () => {
  const [layoutSystem, createDeck, visualDirector, reviewDeck, deckReviewer, reviewChecklist, layoutsText] = await Promise.all([
    readFile('references/layout-system.md', 'utf8'),
    readFile('skills/create-deck/SKILL.md', 'utf8'),
    readFile('skills/visual-director/SKILL.md', 'utf8'),
    readFile('skills/review-deck/SKILL.md', 'utf8'),
    readFile('skills/deck-reviewer/SKILL.md', 'utf8'),
    readFile('references/review-checklist.md', 'utf8'),
    readFile('templates/layouts.json', 'utf8'),
  ]);

  assert.match(layoutSystem, /right half is \*\*optional\*\*/i);
  assert.match(layoutSystem, /artifact-right/i);
  assert.match(layoutSystem, /generic hub-and-spoke|concentric-circle|orbit graphic/i);
  assert.match(createDeck, /coverRight/);
  assert.match(createDeck, /leave the space empty|whitespace is a valid/i);
  assert.match(visualDirector, /never invent generic orbit/i);
  assert.match(reviewDeck, /decorative or meaningless cover visual/i);
  assert.match(deckReviewer, /flag a cover as Major/i);
  assert.match(reviewChecklist, /decorative filler/i);

  const layouts = JSON.parse(layoutsText);
  const cover = layouts.archetypes.find((layout) => layout.name === 'editorial-cover');
  assert.ok(cover);
  for (const variant of ['artifact-right', 'proof-rail', 'signal-stack']) {
    assert.ok(cover.variants.includes(variant), variant);
  }
  assert.match(cover.avoid, /orbit|concentric/i);
});



test('cover proof and mechanism explanation remain separate', async () => {
  const files = [
    'skills/create-deck/SKILL.md',
    'skills/visual-director/SKILL.md',
    'skills/review-deck/SKILL.md',
    'skills/deck-reviewer/SKILL.md',
  ];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    assert.match(content, /proof rail|proof-rail/i, file);
    assert.match(content, /mechanism|causal/i, file);
    assert.match(content, /next page|next-page|handoff/i, file);
  }
});


test('agent-authored Python SVG workflow is plan-backed and dynamic-first', async () => {
  const [protocol, planTemplate, generator, createDeck, visualDirector, reviewDeck, deckReviewer] = await Promise.all([
    readFile('references/python-svg-authoring.md', 'utf8'),
    readFile('templates/python-svg-plan.md', 'utf8'),
    readFile('scripts/generate-slide-art.py', 'utf8'),
    readFile('skills/create-deck/SKILL.md', 'utf8'),
    readFile('skills/visual-director/SKILL.md', 'utf8'),
    readFile('skills/review-deck/SKILL.md', 'utf8'),
    readFile('skills/deck-reviewer/SKILL.md', 'utf8'),
  ]);

  for (const content of [protocol, planTemplate]) {
    assert.match(content, /source of truth/i);
    assert.match(content, /semantic model/i);
    assert.match(content, /accessibility/i);
    assert.match(content, /validation/i);
  }
  assert.match(protocol, /\.visual\.md/);
  assert.match(protocol, /not.*closed catalog|not the limit|examples.*fallback/i);
  assert.match(generator, /pattern library and fast fallback/i);
  assert.match(createDeck, /deck-local.*\.visual\.md|<visual>\.visual\.md/i);
  assert.match(visualDirector, /pythonSvgPlan/);
  assert.match(reviewDeck, /\.visual\.md.*\.py.*\.svg|\.visual\.md/i);
  assert.match(deckReviewer, /custom SVG.*plan|\.visual\.md/i);
});
