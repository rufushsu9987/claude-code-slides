import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const generator = new URL('../scripts/generate-slide-art.py', import.meta.url);
const python = process.env.PYTHON || 'python3';
const builtInKinds = [
  'agent-journey',
  'architecture-boundary',
  'data-journey',
  'decision-path',
  'infographic',
  'operating-loop',
  'roadmap-horizon',
  'swimlane-process',
  'system-map',
];

function runGenerator(args) {
  return spawnSync(python, [generator.pathname, ...args], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
}

test('Python slide-art generator creates deterministic, portable sketch SVG', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'claude-code-slides-art-'));
  const output = path.join(directory, 'agent-journey.svg');
  const args = [
    '--kind', 'agent-journey',
    '--style', 'sketch',
    '--seed', '42',
    '--output', output,
    '--title', 'Portable Core',
  ];

  const first = runGenerator(args);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const firstContent = await readFile(output, 'utf8');
  assert.match(firstContent, /^<svg\b/);
  assert.match(firstContent, /viewBox="0 0 1200 700"/);
  assert.match(firstContent, /role="img"/);
  assert.match(firstContent, /Portable Core/);
  assert.match(firstContent, /human|agent|progress/i);
  assert.doesNotMatch(firstContent, /\/Users\/|file:\/\/|<script\b/i);

  const second = runGenerator(args);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.equal(await readFile(output, 'utf8'), firstContent);
});

test('Python slide-art generator supports all Visual Grammar v2 kinds and styles', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'claude-code-slides-art-kinds-'));
  for (const kind of builtInKinds) {
    const sketch = path.join(directory, `${kind}-sketch.svg`);
    const clean = path.join(directory, `${kind}-clean.svg`);
    for (const [style, output] of [['sketch', sketch], ['clean', clean]]) {
      const result = runGenerator(['--kind', kind, '--style', style, '--seed', '7', '--output', output]);
      assert.equal(result.status, 0, `${kind}/${style}: ${result.stderr || result.stdout}`);
      const content = await readFile(output, 'utf8');
      assert.match(content, /^<svg\b/);
      assert.match(content, /viewBox="0 0 1200 700"/);
      assert.match(content, /<title id="title">/);
      assert.match(content, /<desc id="desc">/);
    }
    assert.notEqual(await readFile(sketch, 'utf8'), await readFile(clean, 'utf8'));
  }
});

test('Python slide-art generator lists every built-in kind', () => {
  const result = runGenerator(['--list-kinds']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(result.stdout.trim().split(/\r?\n/), builtInKinds);
});

test('Python slide-art generator supports transparent caption-free assets and custom accent', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'claude-code-slides-art-options-'));
  const output = path.join(directory, 'custom.svg');
  const result = runGenerator([
    '--kind', 'infographic',
    '--transparent',
    '--hide-caption',
    '--accent', '#3366CC',
    '--output', output,
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const content = await readFile(output, 'utf8');
  assert.match(content, /#3366CC/i);
  assert.doesNotMatch(content, /<rect width="1200" height="700" fill=/);
  assert.doesNotMatch(content, /INFOGRAPHIC STORY/i);
});

test('Python slide-art generator rejects unknown kinds and malformed colors', () => {
  const unknown = runGenerator(['--kind', 'unknown', '--output', path.join(tmpdir(), 'invalid.svg')]);
  assert.notEqual(unknown.status, 0);
  assert.match(`${unknown.stderr}${unknown.stdout}`, /invalid choice|usage/i);

  const invalidColor = runGenerator([
    '--kind', 'infographic',
    '--accent', 'red',
    '--output', path.join(tmpdir(), 'invalid-color.svg'),
  ]);
  assert.notEqual(invalidColor.status, 0);
  assert.match(`${invalidColor.stderr}${invalidColor.stdout}`, /hex color|six-digit|usage/i);
});
