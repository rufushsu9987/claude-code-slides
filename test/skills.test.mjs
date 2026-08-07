import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const expected = [
  'claude-code-style',
  'create-deck',
  'deck-architect',
  'deck-reviewer',
  'review-deck',
  'speaker-notes',
  'visual-director',
];

function frontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  assert.ok(match, 'SKILL.md must contain frontmatter');
  return Object.fromEntries(
    match[1]
      .split('\n')
      .filter((line) => line.includes(':'))
      .map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

test('all Codex skills have portable metadata and repo links', async () => {
  const skillDirectories = (await readdir('skills', { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(skillDirectories, expected);

  for (const name of expected) {
    const content = await readFile(path.join('skills', name, 'SKILL.md'), 'utf8');
    const metadata = frontmatter(content);
    assert.equal(metadata.name, name);
    assert.ok(metadata.description);
    assert.doesNotMatch(content, /\$ARGUMENTS|CLAUDE_PLUGIN_ROOT|claude-code-slides:/);
    const forwarder = await readFile(path.join('.agents', 'skills', name, 'SKILL.md'), 'utf8');
    assert.match(forwarder, new RegExp(`\\.\\.\\/\\.\\.\\/\\.\\.\\/skills/${name}/SKILL\\.md`));
  }
});
