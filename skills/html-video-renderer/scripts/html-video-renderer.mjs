#!/usr/bin/env node

import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { formatFfconcatPath, validateTimings } from '../lib/promo.mjs';

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

async function requireCommand(command) {
  try {
    const result = await runProcess(command, ['-version']);
    if (result.code !== 0) throw new Error(result.stderr.trim());
  } catch {
    throw new Error(`${command} is required for rendering but was not found or failed to start.`);
  }
}

async function findFrame(framesPath, index) {
  const candidates = [`slide-${index}.png`, `scene-${index}.png`, `slide-${String(index).padStart(2, '0')}.png`];
  for (const candidate of candidates) {
    const file = path.join(framesPath, candidate);
    try {
      const fileStat = await stat(file);
      if (fileStat.isFile() && fileStat.size > 0) return file;
    } catch {
      // Try the next conventional name.
    }
  }
  return null;
}

export async function collectFrames(framesPath, sceneCount) {
  const frames = [];
  for (let index = 1; index <= sceneCount; index += 1) {
    const frame = await findFrame(framesPath, index);
    if (!frame) throw new Error(`Missing frame for scene ${index} in ${framesPath}. Expected slide-${index}.png.`);
    frames.push(frame);
  }
  return frames;
}

function escapeSubtitlePath(value) {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll(':', '\\:')
    .replaceAll("'", "\\'");
}

export function buildRenderPlan({ frames, timings, output }) {
  const validation = validateTimings(timings, frames.length);
  if (!validation.ok) throw new Error(validation.errors.join(' '));
  const outputPath = path.resolve(output);
  const segmentsPath = path.join(outputPath, 'segments');
  const entries = timings.scenes.map((scene, index) => ({
    index: index + 1,
    frame: path.resolve(frames[index]),
    start: scene.start,
    end: scene.end,
    duration: scene.duration,
    segment: path.join(segmentsPath, `seg${String(index + 1).padStart(2, '0')}.mp4`),
  }));
  return {
    schemaVersion: 1,
    source: 'html-captured-frames',
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    duration: timings.duration,
    entries,
    concatManifest: entries.map((entry) => `${formatFfconcatPath(entry.segment)}\n`).join(''),
  };
}

async function captureWithPlaywright({ htmlPath, framesPath, sceneCount, url, viewport }) {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    playwright = null;
  }
  if (!playwright) {
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({ headless: true });
      const page = await browser.newPage();
      await page.setViewport(viewport);
      await capturePageFrames(page, htmlPath, framesPath, sceneCount, url);
      await browser.close();
      return 'puppeteer';
    } catch {
      throw new Error('HTML capture requires an installed Playwright or Puppeteer package.');
    }
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  await capturePageFrames(page, htmlPath, framesPath, sceneCount, url);
  await browser.close();
  return 'playwright';
}

async function capturePageFrames(page, htmlPath, framesPath, sceneCount, url) {
  await mkdir(framesPath, { recursive: true });
  const baseUrl = url || pathToFileURL(path.resolve(htmlPath)).href;
  for (let index = 1; index <= sceneCount; index += 1) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    const target = `${baseUrl}${separator}render=video#${index}`;
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(framesPath, `slide-${index}.png`) });
  }
}

export function buildSubtitleMuxArgs({ silentVideo, audio = null, subtitles = null, finalVideo, supportsBurnIn = false }) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', silentVideo];
  let nextInputIndex = 1;
  let audioIndex = null;
  let subtitleIndex = null;
  if (audio) {
    args.push('-i', path.resolve(audio));
    audioIndex = nextInputIndex;
    nextInputIndex += 1;
  }
  const filter = subtitles && supportsBurnIn
    ? `subtitles='${escapeSubtitlePath(path.resolve(subtitles))}':original_size=1920x1080`
    : null;
  if (filter) {
    args.push('-vf', filter);
  } else if (subtitles) {
    args.push('-i', path.resolve(subtitles));
    subtitleIndex = nextInputIndex;
  }
  args.push('-map', '0:v:0');
  if (audioIndex !== null) args.push('-map', `${audioIndex}:a:0`);
  if (subtitleIndex !== null) args.push('-map', `${subtitleIndex}:0`);
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p');
  if (audioIndex !== null) args.push('-c:a', 'aac', '-b:a', '192k');
  if (subtitleIndex !== null) args.push('-c:s', 'mov_text');
  if (audioIndex !== null || subtitleIndex !== null) args.push('-shortest');
  args.push(finalVideo);
  return args;
}

async function supportsSubtitleFilter(ffmpeg) {
  const result = await runProcess(ffmpeg, ['-hide_banner', '-filters']);
  return result.code === 0 && /\bsubtitles\b/.test(result.stdout);
}

async function renderSegments(plan, { audio = null, subtitles = null, ffmpeg = 'ffmpeg' } = {}) {
  await requireCommand(ffmpeg);
  const segmentsPath = path.dirname(plan.entries[0].segment);
  const outputPath = path.dirname(segmentsPath);
  await mkdir(segmentsPath, { recursive: true });
  for (const entry of plan.entries) {
    const result = await runProcess(ffmpeg, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-loop',
      '1',
      '-i',
      entry.frame,
      '-t',
      String(entry.duration),
      '-r',
      String(plan.fps),
      '-vf',
      'format=yuv420p',
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '18',
      entry.segment,
    ]);
    if (result.code !== 0) throw new Error(`FFmpeg failed while rendering scene ${entry.index}.`);
  }

  const concatPath = path.join(outputPath, 'segments.concat.txt');
  await writeFile(concatPath, plan.concatManifest, 'utf8');
  const silentVideo = path.join(outputPath, 'video-no-audio.mp4');
  const concatResult = await runProcess(ffmpeg, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatPath,
    '-c',
    'copy',
    silentVideo,
  ]);
  if (concatResult.code !== 0) throw new Error('FFmpeg failed while concatenating HTML video segments.');

  const finalVideo = path.join(outputPath, 'final.mp4');
  if (!audio && !subtitles) {
    await copyFile(silentVideo, finalVideo);
    return finalVideo;
  }

  const muxResult = await runProcess(ffmpeg, buildSubtitleMuxArgs({
    silentVideo,
    audio,
    subtitles,
    finalVideo,
    supportsBurnIn: subtitles ? await supportsSubtitleFilter(ffmpeg) : false,
  }));
  if (muxResult.code !== 0) throw new Error('FFmpeg failed while muxing audio or subtitles.');
  return finalVideo;
}

export async function renderHtmlVideo({
  html = null,
  frames,
  timings,
  output,
  audio = null,
  subtitles = null,
  capture = false,
  render = false,
  url = null,
  fps = 30,
  ffmpeg = 'ffmpeg',
}) {
  const outputPath = path.resolve(output || 'video-render');
  const framesPath = path.resolve(frames || path.join(outputPath, 'html-frames'));
  const timingsData = typeof timings === 'string' ? JSON.parse(await readFile(timings, 'utf8')) : timings;
  if (!timingsData) throw new Error('A timings.json path or object is required.');
  const sceneCount = timingsData.scenes?.length || 0;
  if (capture) {
    if (!html) throw new Error('--capture requires --html path.');
    const browser = await captureWithPlaywright({
      htmlPath: html,
      framesPath,
      sceneCount,
      url,
      viewport: { width: 1920, height: 1080 },
    });
    timingsData.captureBrowser = browser;
  }
  const framePaths = await collectFrames(framesPath, sceneCount);
  const plan = buildRenderPlan({ frames: framePaths, timings: timingsData, output: outputPath });
  plan.fps = fps;
  await mkdir(outputPath, { recursive: true });
  await writeFile(path.join(outputPath, 'render-plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outputPath, 'html-video-concat.txt'), plan.concatManifest, 'utf8');

  let finalVideo = null;
  if (audio || subtitles || render || process.env.PROMO_RENDER === '1') {
    finalVideo = await renderSegments(plan, { audio, subtitles, ffmpeg });
  }

  return {
    output: outputPath,
    frames: framePaths.length,
    duration: plan.duration,
    plan: path.join(outputPath, 'render-plan.json'),
    concat: path.join(outputPath, 'html-video-concat.txt'),
    video: finalVideo,
    captureBrowser: timingsData.captureBrowser || null,
  };
}

async function main() {
  const { positionals, options } = parseOptions(process.argv.slice(2));
  const timings = options.timings;
  const frames = options.frames;
  if ((!timings || !frames) && !options.help) {
    process.stderr.write('Usage: html-video-renderer.mjs --timings timings.json --frames html-frames --out video-dir [--html index.html --capture]\n');
    return 1;
  }
  if (options.help) {
    process.stdout.write('Usage: html-video-renderer.mjs --timings timings.json --frames html-frames --out video-dir [--html index.html --capture] [--audio narration.mp3] [--subtitles narration.srt]\n');
    return 0;
  }
  const result = await renderHtmlVideo({
    html: options.html || null,
    frames,
    timings,
    output: options.out,
    audio: options.audio || null,
    subtitles: options.subtitles || null,
    capture: Boolean(options.capture),
    render: Boolean(options.render),
    url: options.url || null,
    fps: Number(options.fps || 30),
    ffmpeg: options.ffmpeg || 'ffmpeg',
  });
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : `Render plan written to ${result.plan}\nFrames: ${result.frames}\nDuration: ${result.duration}s\n${result.video ? `Video: ${result.video}\n` : 'Video: not rendered (provide audio/subtitles or PROMO_RENDER=1)\n'}`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    process.stderr.write(`html-video-renderer: ${error.message}\n`);
    process.exitCode = 1;
  });
}
