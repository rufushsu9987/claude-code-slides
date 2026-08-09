import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { releaseValidationErrors } from '../scripts/validate-release.mjs';

const packageJson = { name: 'claude-code-slides', version: '1.2.3' };
const readyChangelog = `# Changelog

## Unreleased

## 1.2.3 - 2026-08-09

- Shipped.
`;

test('release validation accepts matching tags and a cut changelog', () => {
  assert.deepEqual(
    releaseValidationErrors({
      tag: 'claude-code-slides--v1.2.3',
      packageJson,
      changelog: readyChangelog,
    }),
    [],
  );
});

test('release validation rejects stale tags, unreleased entries, and missing release headings', () => {
  const errors = releaseValidationErrors({
    tag: 'claude-code-slides--v1.2.2',
    packageJson,
    changelog: '# Changelog\n\n## Unreleased\n\n<!-- keep this section -->\n\n- Still pending.\n- Also pending.\n',
  });
  assert.equal(errors.length, 3);
  assert.ok(errors.some((error) => error.includes('Release tag')));
  assert.ok(errors.some((error) => error.includes('Unreleased must be empty')));
  assert.ok(errors.some((error) => error.includes('release heading')));
});

test('release publishing waits for the full matrix and verifies the extracted archive', async () => {
  const workflow = await readFile('.github/workflows/release.yml', 'utf8');
  assert.match(workflow, /node-version:\s*\[18, 22, 24\]/);
  assert.match(workflow, /release:\n\s+needs: validate/);
  assert.match(workflow, /validate:release/);
  assert.match(workflow, /sha256sum -c SHA256SUMS/);
  assert.match(workflow, /dist\/verify\/claude-code-slides-/);
  assert.match(workflow, /npm run check/);
});
