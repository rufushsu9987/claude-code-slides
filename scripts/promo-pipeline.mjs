#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const STAGE_ORDER = ['intake', 'deck-and-notes', 'narration', 'renderer', 'qa', 'release'];

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

function runScript(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(scriptRoot, script), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
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

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function firstExisting(files) {
  for (const file of files) {
    if (await exists(file)) return file;
  }
  return null;
}

function jsonStage(result) {
  try {
    return JSON.parse(result.stdout);
  } catch {
    return { output: result.stdout.trim(), error: result.stderr.trim() };
  }
}

async function runStage(stages, name, script, args) {
  const processResult = await runScript(script, [...args, '--json']);
  const data = jsonStage(processResult);
  stages[name] = {
    status: processResult.code === 0 ? 'completed' : 'failed',
    ...data,
    ...(processResult.code === 0 ? {} : { error: processResult.stderr.trim() || 'stage failed' }),
  };
  if (processResult.code !== 0) throw new Error(`${name} failed.`);
  return data;
}

export async function runPromoPipeline({
  source,
  output,
  sourceUrl = null,
  deck = null,
  speakerNotes = null,
  html = null,
  narration = null,
  frames = null,
  video = null,
  packageOutput = null,
  ttsCommand = null,
  visualEvidence = null,
  visualInspected = false,
  requireVisual = false,
  strict = false,
  render = false,
  capture = false,
}) {
  if (!source) throw new Error('A repository source path is required.');
  const outputPath = path.resolve(output || path.join(process.cwd(), 'promo'));
  await mkdir(outputPath, { recursive: true });
  const stages = {};
  let pipelineError = null;

  try {
    await runStage(stages, 'intake', 'project-intake.mjs', [source, '--out', outputPath, ...(sourceUrl ? ['--source-url', sourceUrl] : [])]);

    const deckCandidates = deck ? [deck] : [
      path.join(outputPath, 'deck', 'index.html'),
      path.join(outputPath, 'deck', 'deck.pptx'),
      path.join(outputPath, 'index.html'),
    ];
    const deckPath = await firstExisting(deckCandidates);
    const notesPath = speakerNotes || narration || path.join(outputPath, 'NARRATION.md');
    const notesExists = await exists(notesPath);
    if (deckPath && notesExists) {
      stages['deck-and-notes'] = {
        status: 'completed',
        deck: deckPath,
        speakerNotes: path.resolve(notesPath),
        contract: 'deck and approved speaker notes supplied by the existing authoring capabilities.',
      };
    } else {
      stages['deck-and-notes'] = {
        status: 'skipped',
        deck: deckPath || null,
        speakerNotes: notesExists ? path.resolve(notesPath) : null,
        reason: 'Both a deck artifact and speaker notes are required before strict release.',
      };
    }

    const narrationPath = narration || notesPath;
    if (await exists(narrationPath)) {
      const narrationArgs = [narrationPath, '--out', path.join(outputPath, 'video')];
      if (ttsCommand) narrationArgs.push('--tts-command', ttsCommand);
      await runStage(stages, 'narration', 'narration-pipeline.mjs', narrationArgs);
    } else {
      stages.narration = { status: 'skipped', reason: `No narration source found at ${narrationPath}.` };
    }

    const timingsPath = path.join(outputPath, 'video', 'timings.json');
    const framesPath = frames || path.join(outputPath, 'video', 'html-frames');
    const htmlPath = html || (deckPath && /\.html?$/i.test(deckPath) ? deckPath : null);
    const framesReady = await exists(framesPath);
    const captureReady = Boolean(capture && htmlPath && await exists(htmlPath));
    const rendererInputsReady = capture ? captureReady : framesReady;
    if (rendererInputsReady && await exists(timingsPath)) {
      const rendererArgs = ['--timings', timingsPath, '--frames', framesPath, '--out', path.join(outputPath, 'video')];
      if (htmlPath) rendererArgs.push('--html', htmlPath);
      if (capture) rendererArgs.push('--capture');
      if (render) rendererArgs.push('--render');
      const generatedAudio = path.join(outputPath, 'video', 'narration.mp3');
      const generatedSubtitles = path.join(outputPath, 'video', 'narration.srt');
      if (await exists(generatedAudio)) rendererArgs.push('--audio', generatedAudio);
      if (await exists(generatedSubtitles)) rendererArgs.push('--subtitles', generatedSubtitles);
      await runStage(stages, 'renderer', 'html-video-renderer.mjs', rendererArgs);
    } else {
      stages.renderer = {
        status: 'skipped',
        reason: capture && !htmlPath
          ? 'HTML capture was requested but no HTML deck was supplied.'
          : `Frames, timings, or HTML capture inputs are missing: ${framesPath}, ${timingsPath}, ${htmlPath || 'none'}.`,
      };
    }

    const videoPath = video || path.join(outputPath, 'video', 'final.mp4');
    if (await exists(videoPath)) {
      const qaArgs = [outputPath, '--out', path.join(outputPath, 'video'), '--video', videoPath];
      if (await exists(timingsPath)) qaArgs.push('--timings', timingsPath);
      const subtitlePath = path.join(outputPath, 'video', 'narration.srt');
      if (await exists(subtitlePath)) qaArgs.push('--subtitles', subtitlePath);
      if (visualEvidence) qaArgs.push('--visual-evidence', visualEvidence);
      if (visualInspected) qaArgs.push('--visual-inspected');
      if (requireVisual || strict) qaArgs.push('--require-visual');
      if (strict) qaArgs.push('--strict');
      await runStage(stages, 'qa', 'media-qa.mjs', qaArgs);
    } else {
      stages.qa = { status: 'skipped', reason: `No final video found at ${videoPath}.` };
    }

    const qaPath = path.join(outputPath, 'video', 'video-qa.json');
    const factsPath = path.join(outputPath, 'project-facts.json');
    if (packageOutput || (await exists(factsPath) && await exists(qaPath))) {
      await runStage(stages, 'release', 'release-packager.mjs', [outputPath, '--out', packageOutput || path.join(outputPath, 'release'), '--facts', factsPath, ...(await exists(qaPath) ? ['--qa', qaPath] : []), ...(sourceUrl ? ['--repo-url', sourceUrl] : [])]);
    } else {
      stages.release = { status: 'skipped', reason: 'A passing QA manifest or explicit packaging request is missing.' };
    }
  } catch (error) {
    pipelineError = error instanceof Error ? error.message : String(error);
    const failedStage = Object.entries(stages).find(([, stage]) => stage.status === 'failed')?.[0] || 'previous stage';
    for (const stageName of STAGE_ORDER) {
      if (!stages[stageName]) stages[stageName] = { status: 'skipped', reason: `Blocked after ${failedStage} failed.` };
    }
  }

  const completed = Object.values(stages).filter((stage) => stage.status === 'completed').length;
  const failed = Object.values(stages).filter((stage) => stage.status === 'failed').length;
  const skipped = Object.values(stages).filter((stage) => stage.status === 'skipped').length;
  const result = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: pipelineError || failed > 0 || (strict && skipped > 0) ? 'FAILED' : skipped > 0 ? 'PARTIAL' : 'PASS',
    output: outputPath,
    completed,
    failed,
    skipped,
    externalPublish: 'manual-approval-required',
    stages,
    error: pipelineError,
  };
  await writeFile(path.join(outputPath, 'pipeline-status.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

async function main() {
  const { positionals, options } = parseOptions(process.argv.slice(2));
  const command = positionals[0] || 'run';
  if (options.help || command === 'help') {
    process.stdout.write('Usage: promo-pipeline.mjs run <repository-path> [--out promo-dir] [--deck deck-file] [--html html-deck] [--speaker-notes notes-file] [--narration NARRATION.md] [--tts-command command] [--frames html-frames] [--capture] [--video final.mp4] [--package release-dir] [--visual-evidence contact-sheet.png] [--visual-inspected] [--require-visual] [--render] [--strict] [--json]\n');
    return 0;
  }
  if (command !== 'run') {
    process.stderr.write(`Unknown pipeline command: ${command}\n`);
    return 1;
  }
  const source = options.source || positionals[1];
  const result = await runPromoPipeline({
    source,
    output: options.out,
    sourceUrl: options['source-url'] || null,
    deck: options.deck || null,
    speakerNotes: options['speaker-notes'] || null,
    html: options.html || null,
    narration: options.narration || null,
    frames: options.frames || null,
    video: options.video || null,
    packageOutput: options.package || null,
    ttsCommand: options['tts-command'] || null,
    visualEvidence: options['visual-evidence'] || null,
    visualInspected: Boolean(options['visual-inspected']),
    requireVisual: Boolean(options['require-visual']),
    strict: Boolean(options.strict),
    render: Boolean(options.render),
    capture: Boolean(options.capture),
  });
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : `Promo pipeline ${result.status}\nOutput: ${result.output}\nCompleted: ${result.completed}, skipped: ${result.skipped}, failed: ${result.failed}\n`);
  return result.status === 'FAILED' ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    process.stderr.write(`promo-pipeline: ${error.message}\n`);
    process.exitCode = 1;
  });
}
