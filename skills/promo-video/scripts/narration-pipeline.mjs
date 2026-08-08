#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import {
  buildSrt,
  buildTimings,
  parseScenes,
  shellQuote,
} from '../lib/promo.mjs';

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

function runProcess(command, args, { shell = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell, stdio: ['ignore', 'pipe', 'pipe'] });
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

async function probeAudioDuration(file, ffprobeCommand = 'ffprobe') {
  const result = await runProcess(ffprobeCommand, [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    file,
  ]);
  if (result.code !== 0) return null;
  const duration = Number.parseFloat(result.stdout.trim());
  return Number.isFinite(duration) && duration > 0 ? Number(duration.toFixed(3)) : null;
}

async function runTtsCommand(commandTemplate, input, output) {
  if (!commandTemplate.includes('{input}') || !commandTemplate.includes('{output}')) {
    throw new Error('The TTS command must contain both {input} and {output} placeholders.');
  }
  const command = commandTemplate
    .replaceAll('{input}', shellQuote(input))
    .replaceAll('{output}', shellQuote(output));
  const result = await runProcess(command, [], { shell: true });
  if (result.code !== 0) {
    throw new Error(`TTS command failed for ${path.basename(input)} with exit code ${result.code}.`);
  }
}

async function combineAudioSegments(audioFiles, outputPath, ffmpegCommand = 'ffmpeg') {
  const manifestPath = path.join(outputPath, 'audio.concat.txt');
  await writeFile(manifestPath, audioFiles.map((file) => `file ${shellQuote(file)}\n`).join(''), 'utf8');
  const result = await runProcess(ffmpegCommand, [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    manifestPath,
    '-c',
    'copy',
    path.join(outputPath, 'narration.mp3'),
  ]);
  if (result.code !== 0) throw new Error('FFmpeg failed while combining narration segments.');
  return path.join(outputPath, 'narration.mp3');
}

export async function prepareNarration({
  source,
  output,
  ttsCommand = null,
  ffprobeCommand = 'ffprobe',
  ffmpegCommand = 'ffmpeg',
  charsPerSecond = 4,
  minimumSeconds = 2,
}) {
  if (!source) throw new Error('A narration source path is required.');
  const sourcePath = path.resolve(source);
  const outputPath = path.resolve(output || path.join(path.dirname(sourcePath), 'video'));
  const segmentsPath = path.join(outputPath, 'segments');
  await mkdir(segmentsPath, { recursive: true });

  const sourceText = await readFile(sourcePath, 'utf8');
  const scenes = parseScenes(sourceText);
  if (scenes.length === 0) throw new Error('No narration scenes were found.');

  const sceneFiles = [];
  for (const scene of scenes) {
    const filename = `seg${String(scene.index).padStart(2, '0')}.txt`;
    const file = path.join(segmentsPath, filename);
    await writeFile(file, `${scene.text}\n`, 'utf8');
    sceneFiles.push({ ...scene, textFile: file });
  }

  let audioStatus = 'not-generated';
  let measuredDurations = [];
  const audioFiles = [];
  if (ttsCommand) {
    audioStatus = 'generated';
    for (const scene of sceneFiles) {
      const outputFile = path.join(segmentsPath, `seg${String(scene.index).padStart(2, '0')}.mp3`);
      await runTtsCommand(ttsCommand, scene.textFile, outputFile);
      audioFiles.push(outputFile);
      const duration = await probeAudioDuration(outputFile, ffprobeCommand);
      if (duration === null) audioStatus = 'generated-unmeasured';
      measuredDurations.push(duration);
    }
    if (audioFiles.length === sceneFiles.length) await combineAudioSegments(audioFiles, outputPath, ffmpegCommand);
  }

  const timingScenes = sceneFiles.map((scene, index) => ({
    ...scene,
    duration: measuredDurations[index] || undefined,
  }));
  const timings = buildTimings(timingScenes, { charsPerSecond, minimumSeconds });
  if (audioStatus === 'generated-unmeasured') timings.timingConfidence = 'estimated';

  await writeFile(path.join(outputPath, 'narration.txt'), `${scenes.map((scene) => scene.text).join('\n\n')}\n`, 'utf8');
  await writeFile(path.join(outputPath, 'timings.json'), `${JSON.stringify(timings, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outputPath, 'narration.srt'), buildSrt(timings), 'utf8');

  return {
    output: outputPath,
    scenes: scenes.length,
    duration: timings.duration,
    timingConfidence: timings.timingConfidence,
    audioStatus,
    files: {
      narration: path.join(outputPath, 'narration.txt'),
      audio: ttsCommand ? path.join(outputPath, 'narration.mp3') : null,
      timings: path.join(outputPath, 'timings.json'),
      subtitles: path.join(outputPath, 'narration.srt'),
      segments: segmentsPath,
    },
  };
}

async function main() {
  const { positionals, options } = parseOptions(process.argv.slice(2));
  const source = options.source || positionals[0];
  if (!source || options.help) {
    process.stdout.write('Usage: narration-pipeline.mjs <narration.md> [--out video-dir] [--tts-command command] [--json]\n');
    return source ? 0 : 1;
  }
  const result = await prepareNarration({
    source,
    output: options.out,
    ttsCommand: options['tts-command'] || null,
    ffprobeCommand: options.ffprobe || 'ffprobe',
    ffmpegCommand: options.ffmpeg || 'ffmpeg',
    charsPerSecond: Number(options['chars-per-second'] || 4),
    minimumSeconds: Number(options['minimum-seconds'] || 2),
  });
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : `Narration prepared in ${result.output}\nScenes: ${result.scenes}\nDuration: ${result.duration}s (${result.timingConfidence})\nAudio: ${result.audioStatus}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`narration-pipeline: ${error.message}\n`);
    process.exitCode = 1;
  });
}
