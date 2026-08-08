#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { scanForSecrets, validateTimings } from '../lib/promo.mjs';

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.srt', '.vtt', '.html', '.js', '.mjs', '.css', '.yml', '.yaml']);
const IGNORED = new Set(['.git', 'node_modules', 'release', 'coverage', 'dist']);

function parseOptions(argv) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const [key, inline] = token.slice(2).split('=', 2);
    if (inline !== undefined) options[key] = inline;
    else if (argv[index + 1] && !argv[index + 1].startsWith('--')) options[key] = argv[++index];
    else options[key] = true;
  }
  return { positionals, options };
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

async function walkTextFiles(root, current = '', output = []) {
  const directory = path.join(root, current);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED.has(entry.name)) continue;
    const relative = path.join(current, entry.name);
    if (entry.isDirectory()) await walkTextFiles(root, relative, output);
    else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) output.push(relative);
    if (output.length >= 300) return output;
  }
  return output;
}

async function firstMatching(root, predicate) {
  const files = await walkTextFiles(root);
  const candidates = [];
  for (const relative of files) {
    if (!predicate(relative)) continue;
    try {
      const fileStat = await stat(path.join(root, relative));
      if (fileStat.isFile() && fileStat.size > 0) candidates.push(path.join(root, relative));
    } catch {
      // Ignore files that disappear during a render.
    }
  }
  return candidates[0] || null;
}

function parseSrtTimestamp(value) {
  const match = String(value).match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
}

export function parseSrt(value) {
  const blocks = String(value).trim() ? String(value).trim().split(/\n\s*\n/) : [];
  const cues = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    const timingLine = lines.find((line) => line.includes('-->'));
    const timing = timingLine?.match(/^(\S+)\s+-->\s+(\S+)/);
    if (!timing) continue;
    const start = parseSrtTimestamp(timing[1]);
    const end = parseSrtTimestamp(timing[2]);
    cues.push({ start, end, text: lines.slice(lines.indexOf(timingLine) + 1).join('\n').trim() });
  }
  return cues;
}

function addCheck(checks, name, status, message, evidence = []) {
  checks.push({ name, status, message, evidence });
}

function markdownReport(result) {
  const lines = [
    '# Video QA',
    '',
    `- Status: ${result.ok ? 'PASS' : 'FAIL'}`,
    `- Generated: ${result.generatedAt}`,
    `- Video: ${result.video || 'not provided'}`,
    '',
    '## Checks',
    '',
  ];
  for (const check of result.checks) {
    lines.push(`- ${check.status} ${check.name}: ${check.message}`);
    for (const evidence of check.evidence || []) lines.push(`  - Evidence: ${evidence}`);
  }
  lines.push('', '## Rules', '', '- A PASS means only the checks reported here have been executed successfully.', '- Visual inspection is not claimed unless `--visual-inspected` was supplied with an existing evidence path.', '- No external upload or publication is performed by this QA script.', '');
  return `${lines.join('\n')}\n`;
}

export async function runMediaQa({
  root,
  output,
  video = null,
  timings = null,
  subtitles = null,
  visualEvidence = null,
  visualInspected = false,
  requireVisual = false,
  strict = false,
}) {
  if (!root) throw new Error('A QA root directory is required.');
  const rootPath = path.resolve(root);
  const outputPath = path.resolve(output || rootPath);
  const checks = [];
  const videoPath = video ? path.resolve(video) : await firstMatching(rootPath, (file) => /\.(mp4|webm|mov)$/i.test(file));
  const timingsPath = timings ? path.resolve(timings) : await firstMatching(rootPath, (file) => path.basename(file) === 'timings.json');
  const subtitlesPath = subtitles ? path.resolve(subtitles) : await firstMatching(rootPath, (file) => /\.(srt|vtt)$/i.test(file));
  const visualPath = visualEvidence ? path.resolve(visualEvidence) : await firstMatching(rootPath, (file) => /contact-sheet|qa-frame|qa_scene|qa-frame/i.test(file) && /\.(png|jpg|jpeg|webp)$/i.test(file));
  let visualExists = false;
  if (visualPath) {
    try {
      const visualStat = await stat(visualPath);
      visualExists = visualStat.isFile() && visualStat.size > 0;
    } catch {
      visualExists = false;
    }
  }

  const textFiles = await walkTextFiles(rootPath);
  let secretCount = 0;
  for (const relative of textFiles) {
    try {
      const content = await readFile(path.join(rootPath, relative), 'utf8');
      secretCount += scanForSecrets(content).length;
    } catch {
      // A binary or transient file is not a QA failure by itself.
    }
  }
  addCheck(
    checks,
    'public-secret-scan',
    secretCount === 0 ? 'PASS' : 'FAIL',
    secretCount === 0 ? 'No secret-like values found in scanned text files.' : `${secretCount} secret-like value(s) found; remove or redact them.`,
  );

  let timingData = null;
  if (timingsPath) {
    try {
      timingData = JSON.parse(await readFile(timingsPath, 'utf8'));
      const validation = validateTimings(timingData);
      addCheck(checks, 'timings', validation.ok ? 'PASS' : 'FAIL', validation.ok ? `Validated ${timingData.scenes.length} contiguous scene(s).` : validation.errors.join(' '), [timingsPath]);
    } catch {
      addCheck(checks, 'timings', 'FAIL', 'timings.json could not be read or parsed.', [timingsPath]);
    }
  } else {
    addCheck(checks, 'timings', strict ? 'FAIL' : 'SKIP', strict ? 'timings.json is required in strict mode.' : 'No timings.json provided.');
  }

  let srtCues = [];
  if (subtitlesPath) {
    try {
      srtCues = parseSrt(await readFile(subtitlesPath, 'utf8'));
      const expected = timingData?.scenes?.length;
      const countOk = expected === undefined || expected === srtCues.length;
      const orderingOk = srtCues.every((cue) => Number.isFinite(cue.start) && Number.isFinite(cue.end) && cue.end > cue.start);
      addCheck(checks, 'subtitles', countOk && orderingOk ? 'PASS' : 'FAIL', countOk && orderingOk ? `Validated ${srtCues.length} subtitle cue(s).` : 'Subtitle cue count or time ordering is invalid.', [subtitlesPath]);
    } catch {
      addCheck(checks, 'subtitles', 'FAIL', 'Subtitle file could not be read.', [subtitlesPath]);
    }
  } else {
    addCheck(checks, 'subtitles', strict ? 'FAIL' : 'SKIP', strict ? 'A subtitle file is required in strict mode.' : 'No subtitle file provided.');
  }

  let videoMetadata = null;
  if (videoPath) {
    try {
      const fileStat = await stat(videoPath);
      addCheck(checks, 'video-file', fileStat.size > 0 ? 'PASS' : 'FAIL', fileStat.size > 0 ? `Non-zero media file (${fileStat.size} bytes).` : 'Video file is empty.', [videoPath]);
    } catch {
      addCheck(checks, 'video-file', 'FAIL', 'Video path does not exist.', [videoPath]);
    }

    try {
      const result = await runProcess('ffprobe', ['-v', 'error', '-show_entries', 'stream=index,codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels:format=duration,size', '-of', 'json', videoPath]);
      if (result.code !== 0) throw new Error('ffprobe failed');
      videoMetadata = JSON.parse(result.stdout);
      const videoStream = videoMetadata.streams?.find((stream) => stream.codec_type === 'video');
      const audioStream = videoMetadata.streams?.find((stream) => stream.codec_type === 'audio');
      const shapeOk = videoStream?.width === 1920 && videoStream?.height === 1080 && videoStream?.r_frame_rate === '30/1';
      addCheck(checks, 'ffprobe-shape', shapeOk ? 'PASS' : 'FAIL', shapeOk ? 'Video is 1920x1080 at 30 fps.' : 'Video shape is not 1920x1080 at 30 fps.', [videoStream ? `${videoStream.codec_name} ${videoStream.width}x${videoStream.height} ${videoStream.r_frame_rate}` : 'video stream missing']);
      addCheck(checks, 'ffprobe-codecs', videoStream?.codec_name === 'h264' && (!audioStream || audioStream.codec_name === 'aac') ? 'PASS' : 'FAIL', videoStream?.codec_name === 'h264' && (!audioStream || audioStream.codec_name === 'aac') ? 'H.264 video and AAC audio are present.' : 'Expected H.264 video and optional AAC audio.', [audioStream ? `${videoStream?.codec_name || 'unknown'} + ${audioStream.codec_name}` : videoStream?.codec_name || 'video stream missing']);
    } catch {
      addCheck(checks, 'ffprobe', strict ? 'FAIL' : 'SKIP', strict ? 'ffprobe is required in strict mode and failed.' : 'ffprobe is unavailable; metadata checks were skipped.', [videoPath]);
    }

    try {
      const result = await runProcess('ffmpeg', ['-hide_banner', '-v', 'error', '-i', videoPath, '-f', 'null', '-']);
      addCheck(checks, 'full-decode', result.code === 0 ? 'PASS' : 'FAIL', result.code === 0 ? 'FFmpeg decoded the complete file.' : 'FFmpeg reported a decode error.', [videoPath]);
    } catch {
      addCheck(checks, 'full-decode', strict ? 'FAIL' : 'SKIP', strict ? 'ffmpeg is required in strict mode.' : 'ffmpeg is unavailable; full decode was skipped.');
    }

    try {
      const result = await runProcess('ffmpeg', ['-hide_banner', '-i', videoPath, '-af', 'volumedetect', '-f', 'null', '-']);
      const text = `${result.stdout}\n${result.stderr}`;
      const mean = Number.parseFloat(text.match(/mean_volume:\s+(-?[\d.]+)\s+dB/)?.[1]);
      const peak = Number.parseFloat(text.match(/max_volume:\s+(-?[\d.]+)\s+dB/)?.[1]);
      const volumeOk = result.code === 0 && Number.isFinite(mean) && Number.isFinite(peak) && peak <= 0 && mean > -60;
      addCheck(checks, 'audio-level', volumeOk ? 'PASS' : 'FAIL', volumeOk ? `Mean ${mean} dB, peak ${peak} dB.` : 'Audio level could not be verified or is silent/clipped.', [videoPath]);
    } catch {
      addCheck(checks, 'audio-level', strict ? 'FAIL' : 'SKIP', strict ? 'ffmpeg is required in strict mode.' : 'ffmpeg is unavailable; audio level was skipped.');
    }
  } else {
    addCheck(checks, 'video-file', strict ? 'FAIL' : 'SKIP', strict ? 'A video file is required in strict mode.' : 'No MP4/WebM/MOV was found; static QA only.');
  }

  const visualStatus = visualExists && visualInspected ? 'PASS' : requireVisual ? 'FAIL' : 'SKIP';
  const visualMessage = visualExists && visualInspected
    ? 'Visual evidence exists and was marked inspected by the caller.'
    : requireVisual
      ? visualPath ? 'A readable visual evidence file and --visual-inspected are required.' : 'A visual evidence path and --visual-inspected are required.'
      : visualPath && !visualExists
        ? 'Visual evidence path was provided but the file is missing or empty.'
        : visualPath
          ? 'Visual evidence exists but was not marked inspected.'
          : 'No contact sheet or QA frame was provided.';
  addCheck(checks, 'visual-evidence', visualStatus, visualMessage, visualPath ? [visualPath] : []);

  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    ok: checks.every((check) => check.status !== 'FAIL') && (!strict || checks.every((check) => check.status === 'PASS')),
    root: rootPath,
    video: videoPath,
    timings: timingsPath,
    subtitles: subtitlesPath,
    visualEvidence: visualPath,
    visualInspected: Boolean(visualPath && visualInspected),
    checks,
    metadata: videoMetadata,
    subtitleCueCount: srtCues.length,
  };
  await writeFile(path.join(outputPath, 'video-qa.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outputPath, 'VIDEO_QA.md'), markdownReport(result), 'utf8');
  return result;
}

async function main() {
  const { positionals, options } = parseOptions(process.argv.slice(2));
  const root = options.root || positionals[0];
  if (!root || options.help) {
    process.stdout.write('Usage: media-qa.mjs <promo-dir> [--video final.mp4] [--timings timings.json] [--subtitles narration.srt] [--strict] [--json]\n');
    return root ? 0 : 1;
  }
  const result = await runMediaQa({
    root,
    output: options.out,
    video: options.video || null,
    timings: options.timings || null,
    subtitles: options.subtitles || null,
    visualEvidence: options['visual-evidence'] || null,
    visualInspected: Boolean(options['visual-inspected']),
    requireVisual: Boolean(options['require-visual']),
    strict: Boolean(options.strict),
  });
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : `Media QA ${result.ok ? 'PASS' : 'FAIL'}\nReport: ${path.join(path.resolve(options.out || root), 'VIDEO_QA.md')}\n`);
  return result.ok ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    process.stderr.write(`media-qa: ${error.message}\n`);
    process.exitCode = 1;
  });
}
