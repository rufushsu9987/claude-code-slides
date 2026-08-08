#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  buildStoryBrief,
  extractCommands,
  extractFormats,
  normalizeRelativePath,
  redactSecrets,
  scanForSecrets,
  selectIntakeFiles,
} from '../lib/promo.mjs';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.hg',
  '.svn',
  'node_modules',
  'vendor',
  'dist',
  'build',
  'coverage',
  '.tmp',
]);
const MAX_FILES = 120;
const MAX_FILE_BYTES = 300_000;

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

async function walkFiles(root, current = '', output = []) {
  if (output.length >= MAX_FILES) return output;
  const directory = path.join(root, current);
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (output.length >= MAX_FILES) break;
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const relative = normalizeRelativePath(path.join(current, entry.name));
    if (entry.isDirectory()) await walkFiles(root, relative, output);
    else if (entry.isFile()) output.push(relative);
  }
  return output;
}

async function readGitRemote(root) {
  try {
    const config = await readFile(path.join(root, '.git', 'config'), 'utf8');
    const match = config.match(/\[remote "origin"\][\s\S]*?\n\s*url\s*=\s*([^\n]+)/);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function parseJsonDocument(relativePath, content) {
  if (!relativePath.toLowerCase().endsWith('.json')) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function chooseIdentity(documents) {
  const candidates = documents
    .filter(({ parsed }) => parsed && typeof parsed === 'object')
    .map(({ relativePath, parsed }) => ({ relativePath, parsed }));
  const rank = (relativePath) => {
    const normalized = relativePath.replaceAll('\\', '/').toLowerCase();
    if (normalized === 'package.json') return 0;
    if (normalized === 'plugin.json') return 1;
    if (/(^|\/)(package|plugin)\.json$/i.test(normalized)) return 2;
    return 3;
  };
  const preferred = candidates.sort((left, right) => rank(left.relativePath) - rank(right.relativePath) || left.relativePath.localeCompare(right.relativePath))[0];
  const parsed = preferred?.parsed || {};
  return {
    name: parsed.name || null,
    version: parsed.version || null,
    description: parsed.description || null,
    license: parsed.license || null,
    homepage: parsed.homepage || null,
    repository:
      typeof parsed.repository === 'string' ? parsed.repository : parsed.repository?.url || null,
    source: preferred?.relativePath || null,
  };
}

function collectEvidence(documents, identity, formats, commands) {
  const evidence = [];
  if (identity.license) evidence.push({ field: 'license', value: identity.license, source: identity.source });
  if (identity.repository) evidence.push({ field: 'repository', value: identity.repository, source: identity.source });
  if (formats.length > 0) evidence.push({ field: 'formats', value: formats.join(', '), source: 'selected documentation' });
  if (commands.length > 0) evidence.push({ field: 'commands', value: commands.join(' | '), source: 'selected documentation' });
  for (const { relativePath, parsed } of documents) {
    if (!parsed?.keywords || !Array.isArray(parsed.keywords)) continue;
    evidence.push({ field: 'keywords', value: parsed.keywords.join(', '), source: relativePath });
  }
  return evidence;
}

export async function intake({ source, output, sourceUrl = null }) {
  if (!source) throw new Error('A repository source path is required.');
  const sourcePath = path.resolve(source);
  const sourceStat = await stat(sourcePath);
  if (!sourceStat.isDirectory()) throw new Error(`Source is not a directory: ${sourcePath}`);

  const allFiles = await walkFiles(sourcePath);
  const selectedFiles = selectIntakeFiles(allFiles);
  const documents = [];
  const contentParts = [];
  let redactedSecretCount = 0;
  const warnings = [];

  for (const relativePath of selectedFiles) {
    const absolutePath = path.join(sourcePath, relativePath);
    const fileStat = await stat(absolutePath);
    if (fileStat.size > MAX_FILE_BYTES) {
      warnings.push(`Skipped ${relativePath}: file is larger than ${MAX_FILE_BYTES} bytes.`);
      continue;
    }
    let raw;
    try {
      raw = await readFile(absolutePath, 'utf8');
    } catch {
      warnings.push(`Skipped ${relativePath}: file is not readable as UTF-8 text.`);
      continue;
    }
    const secretMatches = scanForSecrets(raw);
    redactedSecretCount += secretMatches.length;
    const content = redactSecrets(raw);
    const parsed = parseJsonDocument(relativePath, content);
    documents.push({ relativePath, bytes: fileStat.size, content, parsed });
    contentParts.push(`\n--- ${relativePath} ---\n${content}`);
  }

  if (!selectedFiles.some((relativePath) => /^README/i.test(path.posix.basename(relativePath)))) {
    warnings.push('No README document was found in the selected intake files.');
  }
  if (redactedSecretCount > 0) {
    warnings.push(`Redacted ${redactedSecretCount} secret-like value(s) from the intake evidence.`);
  }
  if (allFiles.length >= MAX_FILES) warnings.push(`File scan capped at ${MAX_FILES} files.`);

  const combined = contentParts.join('\n');
  const identity = chooseIdentity(documents);
  const formats = extractFormats(combined);
  const commands = extractCommands(combined);
  const facts = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      path: sourcePath,
      url: sourceUrl || (await readGitRemote(sourcePath)),
    },
    files: documents.map(({ relativePath, bytes }) => ({ path: relativePath, bytes, redacted: true })),
    identity,
    capabilities: {
      formats,
      commands,
      hosts: [
        ...(combined.includes('Claude Code') || combined.includes('claude plugin') ? ['Claude Code'] : []),
        ...(combined.includes('Codex') || combined.includes('codex plugin') ? ['Codex'] : []),
      ],
    },
    evidence: collectEvidence(documents, identity, formats, commands),
    warnings,
    security: {
      secretsIncluded: false,
      redactedSecretCount,
    },
  };

  const outputPath = path.resolve(output || path.join(sourcePath, 'promo-intake'));
  await import('node:fs/promises').then(({ mkdir }) => mkdir(outputPath, { recursive: true }));
  await writeFile(path.join(outputPath, 'project-facts.json'), `${JSON.stringify(facts, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outputPath, 'story-brief.md'), buildStoryBrief(facts), 'utf8');

  return {
    output: outputPath,
    factsPath: path.join(outputPath, 'project-facts.json'),
    storyBriefPath: path.join(outputPath, 'story-brief.md'),
    facts,
  };
}

async function main() {
  const { positionals, options } = parseOptions(process.argv.slice(2));
  const source = positionals[0];
  if (!source || options.help) {
    process.stdout.write('Usage: project-intake.mjs <repository-path> [--out path] [--source-url url] [--json]\n');
    return source ? 0 : 1;
  }
  const result = await intake({
    source,
    output: options.out,
    sourceUrl: options['source-url'] || null,
  });
  process.stdout.write(
    options.json
      ? `${JSON.stringify(result, null, 2)}\n`
      : `Intake written to ${result.output}\nFacts: ${result.factsPath}\nBrief: ${result.storyBriefPath}\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`project-intake: ${error.message}\n`);
    process.exitCode = 1;
  });
}
