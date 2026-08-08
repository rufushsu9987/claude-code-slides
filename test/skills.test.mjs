import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const expected = [
  'claude-code-style',
  'create-deck',
  'deck-architect',
  'deck-reviewer',
  'html-video-renderer',
  'media-qa',
  'narration-producer',
  'promo-video',
  'release-packager',
  'repo-intake',
  'review-deck',
  'speaker-notes',
  'visual-director',
];

const resources = {
  'claude-code-style': ['references/style-system.md'],
  'create-deck': [
    'references/storytelling.md',
    'references/style-system.md',
    'references/layout-system.md',
    'references/output-formats.md',
    'scripts/slides-cli.mjs',
  ],
  'deck-architect': ['references/storytelling.md'],
  'deck-reviewer': ['references/review-checklist.md', 'references/layout-system.md', 'scripts/slides-cli.mjs'],
  'html-video-renderer': ['lib/promo.mjs', 'scripts/html-video-renderer.mjs'],
  'media-qa': ['lib/promo.mjs', 'scripts/media-qa.mjs'],
  'narration-producer': ['lib/promo.mjs', 'scripts/narration-pipeline.mjs'],
  'promo-video': [
    'lib/promo.mjs',
    'scripts/project-intake.mjs',
    'scripts/narration-pipeline.mjs',
    'scripts/html-video-renderer.mjs',
    'scripts/media-qa.mjs',
    'scripts/release-packager.mjs',
    'scripts/promo-pipeline.mjs',
  ],
  'release-packager': ['lib/promo.mjs', 'scripts/release-packager.mjs'],
  'repo-intake': ['lib/promo.mjs', 'scripts/project-intake.mjs'],
  'review-deck': [
    'references/review-checklist.md',
    'references/style-system.md',
    'references/layout-system.md',
    'references/output-formats.md',
    'scripts/slides-cli.mjs',
  ],
  'speaker-notes': [],
  'visual-director': ['references/style-system.md', 'references/layout-system.md'],
};

function frontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  assert.ok(match, 'SKILL.md must contain frontmatter');
  return Object.fromEntries(
    match[1].split('\n').filter((line) => line.includes(':')).map((line) => {
      const separator = line.indexOf(':');
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('all shared skills use portable metadata and skill-relative resources', async () => {
  const skillDirectories = (await readdir('skills', { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(skillDirectories, expected);
  for (const name of expected) {
    const skillRoot = path.join('skills', name);
    const content = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
    const metadata = frontmatter(content);
    assert.equal(metadata.name, name);
    assert.ok(metadata.description);
    assert.doesNotMatch(content, /\$ARGUMENTS|argument-hint:|effort:|user-invocable:|CLAUDE_PLUGIN_ROOT|<plugin-root>|claude-code-slides:/);
    assert.doesNotMatch(content, /\.\.\//);
    for (const resource of resources[name]) {
      assert.match(content, new RegExp(escaped(resource)));
      const resourceStat = await stat(path.join(skillRoot, resource));
      assert.equal(resourceStat.isFile(), true);
      if (resource.endsWith('.mjs')) assert.notEqual(resourceStat.mode & 0o111, 0);
    }
    const forwarder = await readFile(path.join('.agents', 'skills', name, 'SKILL.md'), 'utf8');
    assert.match(forwarder, new RegExp(`\\.\\.\\/\\.\\.\\/\\.\\.\\/skills/${name}/SKILL\\.md`));
  }
});

test('generated skill resources match their canonical sources', async () => {
  const pairs = [
    ['lib/promo.mjs', 'skills/repo-intake/lib/promo.mjs'],
    ['lib/promo.mjs', 'skills/narration-producer/lib/promo.mjs'],
    ['lib/promo.mjs', 'skills/html-video-renderer/lib/promo.mjs'],
    ['lib/promo.mjs', 'skills/media-qa/lib/promo.mjs'],
    ['lib/promo.mjs', 'skills/release-packager/lib/promo.mjs'],
    ['lib/promo.mjs', 'skills/promo-video/lib/promo.mjs'],
    ['references/storytelling.md', 'skills/create-deck/references/storytelling.md'],
    ['references/storytelling.md', 'skills/deck-architect/references/storytelling.md'],
    ['references/style-system.md', 'skills/create-deck/references/style-system.md'],
    ['references/style-system.md', 'skills/review-deck/references/style-system.md'],
    ['references/style-system.md', 'skills/claude-code-style/references/style-system.md'],
    ['references/style-system.md', 'skills/visual-director/references/style-system.md'],
    ['references/layout-system.md', 'skills/create-deck/references/layout-system.md'],
    ['references/layout-system.md', 'skills/review-deck/references/layout-system.md'],
    ['references/layout-system.md', 'skills/visual-director/references/layout-system.md'],
    ['references/layout-system.md', 'skills/deck-reviewer/references/layout-system.md'],
    ['references/output-formats.md', 'skills/create-deck/references/output-formats.md'],
    ['references/output-formats.md', 'skills/review-deck/references/output-formats.md'],
    ['references/review-checklist.md', 'skills/review-deck/references/review-checklist.md'],
    ['references/review-checklist.md', 'skills/deck-reviewer/references/review-checklist.md'],
    ['scripts/skill-cli-wrapper.mjs', 'skills/create-deck/scripts/slides-cli.mjs'],
    ['scripts/skill-cli-wrapper.mjs', 'skills/review-deck/scripts/slides-cli.mjs'],
    ['scripts/skill-cli-wrapper.mjs', 'skills/deck-reviewer/scripts/slides-cli.mjs'],
    ['scripts/project-intake.mjs', 'skills/repo-intake/scripts/project-intake.mjs'],
    ['scripts/project-intake.mjs', 'skills/promo-video/scripts/project-intake.mjs'],
    ['scripts/narration-pipeline.mjs', 'skills/narration-producer/scripts/narration-pipeline.mjs'],
    ['scripts/narration-pipeline.mjs', 'skills/promo-video/scripts/narration-pipeline.mjs'],
    ['scripts/html-video-renderer.mjs', 'skills/html-video-renderer/scripts/html-video-renderer.mjs'],
    ['scripts/html-video-renderer.mjs', 'skills/promo-video/scripts/html-video-renderer.mjs'],
    ['scripts/media-qa.mjs', 'skills/media-qa/scripts/media-qa.mjs'],
    ['scripts/media-qa.mjs', 'skills/promo-video/scripts/media-qa.mjs'],
    ['scripts/release-packager.mjs', 'skills/release-packager/scripts/release-packager.mjs'],
    ['scripts/release-packager.mjs', 'skills/promo-video/scripts/release-packager.mjs'],
    ['scripts/promo-pipeline.mjs', 'skills/promo-video/scripts/promo-pipeline.mjs'],
  ];
  for (const [source, destination] of pairs) {
    const [sourceContent, destinationContent] = await Promise.all([readFile(source), readFile(destination)]);
    assert.equal(destinationContent.equals(sourceContent), true, `${destination} is out of sync`);
  }
});

test('portable deck workflows explicitly enforce layout diversity', async () => {
  const contents = await Promise.all(['skills/create-deck/SKILL.md', 'skills/visual-director/SKILL.md', 'skills/review-deck/SKILL.md', 'skills/deck-reviewer/SKILL.md'].map((file) => readFile(file, 'utf8')));
  for (const content of contents) {
    assert.match(content, /layout archetype|archetypes/i);
    assert.match(content, /consecutive/i);
    assert.match(content, /20%/);
  }
});
