import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const generator = new URL('../scripts/generate-slide-art.py', import.meta.url);
const python = process.env.PYTHON || 'python3';

function runGenerator(args) {
  return spawnSync(python, [generator.pathname, ...args], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
}

test('Python slide-art generator creates deterministic, portable infographic SVG', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'claude-code-slides-art-'));
  const output = path.join(directory, 'infographic.svg');
  const args = ['--kind', 'infographic', '--output', output, '--title', 'Portable Core'];

  const first = runGenerator(args);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const firstContent = await readFile(output, 'utf8');
  assert.match(firstContent, /^<svg\b/);
  assert.match(firstContent, /viewBox="0 0 1200 700"/);
  assert.match(firstContent, /Portable Core/);
  assert.match(firstContent, /problem|method|result/i);
  assert.doesNotMatch(firstContent, /\/Users\/|file:\/\//);

  const second = runGenerator(args);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.equal(await readFile(output, 'utf8'), firstContent);
});

test('Python slide-art generator supports every built-in drawing kind', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'claude-code-slides-art-kinds-'));
  for (const kind of ['infographic', 'data-journey', 'decision-path']) {
    const output = path.join(directory, `${kind}.svg`);
    const result = runGenerator(['--kind', kind, '--output', output]);
    assert.equal(result.status, 0, `${kind}: ${result.stderr || result.stdout}`);
    const content = await readFile(output, 'utf8');
    assert.match(content, /^<svg\b/);
    assert.match(content, /viewBox="0 0 1200 700"/);
  }
});

test('Python slide-art generator rejects unknown drawing kinds', () => {
  const result = runGenerator(['--kind', 'unknown', '--output', path.join(tmpdir(), 'invalid.svg')]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stderr}${result.stdout}`, /invalid choice|usage/i);
});