import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildSrt,
  buildStoryBrief,
  buildTimings,
  classifyArtifacts,
  extractCommands,
  extractFormats,
  parseScenes,
  redactSecrets,
  scanForSecrets,
  splitThreadsPosts,
  validateTimings,
} from '../lib/promo.mjs';
import { buildSubtitleMuxArgs } from '../scripts/html-video-renderer.mjs';
import { runMediaQa } from '../scripts/media-qa.mjs';

test('parseScenes supports explicit scene headings and preserves text', () => {
  const scenes = parseScenes(
    '# Narration\n\n## Scene 1\nHook line.\n\n## Scene 2\nProof line.\n',
  );

  assert.deepEqual(scenes, [
    { index: 1, title: 'Scene 1', text: 'Hook line.' },
    { index: 2, title: 'Scene 2', text: 'Proof line.' },
  ]);
});

test('parseScenes falls back to non-empty paragraphs', () => {
  assert.deepEqual(parseScenes('First paragraph.\n\nSecond paragraph.'), [
    { index: 1, title: 'Scene 1', text: 'First paragraph.' },
    { index: 2, title: 'Scene 2', text: 'Second paragraph.' },
  ]);
});

test('buildTimings creates contiguous estimated timing and validates it', () => {
  const timings = buildTimings(
    [
      { index: 1, title: 'Scene 1', text: '12345678' },
      { index: 2, title: 'Scene 2', text: '123456789012' },
    ],
    { charsPerSecond: 4, minimumSeconds: 2 },
  );

  assert.equal(timings.timingConfidence, 'estimated');
  assert.deepEqual(
    timings.scenes.map(({ start, end }) => [start, end]),
    [
      [0, 2],
      [2, 5],
    ],
  );
  assert.deepEqual(validateTimings(timings, 2), { ok: true, errors: [] });
});

test('buildSrt formats timestamps and scene text', () => {
  const srt = buildSrt({
    scenes: [
      { index: 1, start: 0, end: 2.5, text: '第一幕' },
      { index: 2, start: 2.5, end: 65.125, text: '第二幕' },
    ],
  });

  assert.equal(
    srt,
    '1\n00:00:00,000 --> 00:00:02,500\n第一幕\n\n2\n00:00:02,500 --> 00:01:05,125\n第二幕\n',
  );
});

test('extracts documented formats and commands without duplicates', () => {
  const text = `Supports HTML, Marp, and editable PowerPoint.\n\n/plugin install demo\n/plugin install demo\n$create-deck Build a deck`;
  assert.deepEqual(extractFormats(text), ['HTML', 'Marp', 'PPTX']);
  assert.deepEqual(extractCommands(text), ['/plugin install demo', '$create-deck Build a deck']);
});

test('redacts common secret assignments and reports secret-like content', () => {
  const source = 'api_key=«redacted:sk-…» and token: abcdefghijklmnop --api-key live-secret https://user:password@example.com';
  const redacted = redactSecrets(source);

  assert.doesNotMatch(redacted, /«redacted:sk-…»/);
  assert.doesNotMatch(redacted, /live-secret/);
  assert.doesNotMatch(redacted, /user:password@/);
  assert.match(redacted, /\[REDACTED\]/);
  assert.equal(scanForSecrets(source).length >= 4, true);
});

test('buildStoryBrief distinguishes verified facts from review gaps', () => {
  const brief = buildStoryBrief({
    identity: { name: 'demo', description: 'A demo project' },
    capabilities: { formats: ['HTML'], commands: ['$create-deck demo'] },
    evidence: [{ field: 'license', value: 'MIT', source: 'package.json' }],
    warnings: ['No README found'],
  });

  assert.match(brief, /Verified facts/);
  assert.match(brief, /No README found/);
  assert.match(brief, /\$create-deck demo/);
});

test('classifyArtifacts separates media, source, reports, and unknown files', () => {
  assert.deepEqual(
    classifyArtifacts(['index.html', 'video/final.mp4', 'video/narration.srt', 'VIDEO_QA.md', 'notes.txt']),
    [
      { path: 'index.html', kind: 'html' },
      { path: 'video/final.mp4', kind: 'video' },
      { path: 'video/narration.srt', kind: 'subtitle' },
      { path: 'VIDEO_QA.md', kind: 'qa-report' },
      { path: 'notes.txt', kind: 'documentation' },
    ],
  );
});

test('splitThreadsPosts keeps paragraphs intact and adds numbered labels', () => {
  const posts = splitThreadsPosts('第一段。\n\n第二段。\n\n第三段。', 12);

  assert.deepEqual(posts, [
    '1/3\n第一段。',
    '2/3\n第二段。',
    '3/3\n第三段。',
  ]);
});

test('splitThreadsPosts refuses a single paragraph that exceeds the limit', () => {
  assert.throws(() => splitThreadsPosts('123456789', 8), /exceeds the maximum/);
});

test('media QA rejects missing visual evidence even when inspection is asserted', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'promo-qa-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const result = await runMediaQa({
    root,
    output: root,
    visualEvidence: path.join(root, 'missing-contact-sheet.png'),
    visualInspected: true,
    requireVisual: true,
  });
  assert.equal(result.ok, false);
  assert.equal(result.checks.find((check) => check.name === 'visual-evidence')?.status, 'FAIL');
});

test('subtitle mux falls back to an embedded MP4 subtitle track without libass', () => {
  const args = buildSubtitleMuxArgs({
    silentVideo: '/tmp/video-no-audio.mp4',
    audio: '/tmp/narration.mp3',
    subtitles: '/tmp/narration.srt',
    finalVideo: '/tmp/final.mp4',
    supportsBurnIn: false,
  });
  assert.ok(args.includes('/tmp/narration.srt'));
  assert.ok(args.includes('2:0'));
  assert.ok(args.includes('mov_text'));
  assert.ok(!args.includes('-vf'));
});
