#!/usr/bin/env node

import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { classifyArtifacts, redactSecrets, scanForSecrets, splitThreadsPosts } from '../lib/promo.mjs';

const IGNORED = new Set(['.git', 'node_modules', 'release', 'coverage', 'dist']);
const RELEASE_EXTENSIONS = new Set(['.html', '.css', '.js', '.mjs', '.pptx', '.mp4', '.webm', '.mov', '.mp3', '.wav', '.m4a', '.srt', '.vtt', '.md', '.txt', '.json', '.png', '.jpg', '.jpeg', '.webp']);

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
    if (entry.isDirectory()) await walkFiles(root, relative, output);
    else if (entry.isFile() && RELEASE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) output.push(relative);
    if (output.length >= 500) return output;
  }
  return output;
}

async function readOptionalJson(file) {
  if (!file) return null;
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

function sanitizeAbsolutePath(value, rootPath) {
  if (!path.isAbsolute(value)) return value;
  const relative = path.relative(rootPath, value);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) return `./${relative.replaceAll(path.sep, '/')}`;
  return '[LOCAL_PATH]';
}

function sanitizePublicJson(value, rootPath) {
  if (Array.isArray(value)) return value.map((item) => sanitizePublicJson(item, rootPath));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizePublicJson(item, rootPath)]));
  }
  if (typeof value === 'string') return sanitizePublicText(value, rootPath);
  return value;
}

function sanitizePublicText(value, rootPath) {
  return String(value)
    .replaceAll(rootPath, '[LOCAL_PROMO_ROOT]')
    .replace(/\/(?:Users|private\/tmp|tmp)\/[^\s"'`<>]+/g, '[LOCAL_PATH]');
}

async function copyPublicArtifact(source, target, rootPath) {
  const extension = path.extname(source).toLowerCase();
  if (!['.json', '.md', '.txt', '.srt', '.vtt', '.html', '.js', '.mjs', '.css', '.yaml', '.yml'].includes(extension)) {
    await copyFile(source, target);
    return;
  }
  const content = await readFile(source, 'utf8');
  if (extension === '.json') {
    try {
      await writeFile(target, `${JSON.stringify(sanitizePublicJson(JSON.parse(content), rootPath), null, 2)}\\n`, 'utf8');
      return;
    } catch {
      // Fall through to text sanitization for malformed JSON.
    }
  }
  await writeFile(target, sanitizePublicText(content, rootPath), 'utf8');
}

function buildThreadsSource(facts, { repositoryUrl = null, language = 'zh-TW' } = {}) {
  const identity = facts?.identity || {};
  const formats = facts?.capabilities?.formats || [];
  const commands = facts?.capabilities?.commands || [];
  const url = repositoryUrl || identity.repository || facts?.source?.url || '';
  if (language === 'en') {
    return [
      `${identity.name || 'This project'} is an open-source project.\n\n${identity.description || 'It turns project knowledge into a reusable workflow.'}`,
      formats.length ? `Documented outputs: ${formats.join(', ')}.` : 'The repository documents a reusable workflow.',
      commands.length ? `Example commands:\n${commands.slice(0, 3).join('\n')}` : 'The repository includes installation and usage instructions.',
      url ? `GitHub:\n${url}` : 'Review the repository for installation details.',
      'This draft was generated from verified repository facts. Review it before publishing.',
    ].join('\n\n');
  }
  return [
    `${identity.name || '這個專案'}是一個開源專案。\n\n${identity.description || '它把專案內容整理成可重複使用的工作流程。'}`,
    formats.length ? `目前文件中確認的輸出格式：${formats.join('、')}。` : 'Repository 內包含安裝與使用說明。',
    commands.length ? `使用範例：\n${commands.slice(0, 3).join('\n')}` : '詳細安裝方式請以 Repository 文件為準。',
    url ? `GitHub 連結：\n${url}` : '請從 Repository 取得完整安裝資訊。',
    '這份草稿只使用已驗證的 Repository 資訊，發布前請先人工確認。',
  ].join('\n\n');
}

function releaseReadme({ facts, artifacts, verified }) {
  const identity = facts?.identity || {};
  const lines = [
    '# Promo release bundle',
    '',
    `- Project: ${identity.name || 'Unknown'}`,
    `- Verification: ${verified ? 'PASS' : 'UNVERIFIED'}`,
    '- External publishing: human approval required',
    '- Bundle paths are relative; local source paths are intentionally omitted.',
    '',
    '## Artifacts',
    '',
  ];
  for (const artifact of artifacts) lines.push(`- ${artifact.kind}: ${artifact.target} (${artifact.verified ? 'verified' : 'unverified'})`);
  lines.push('', '## Safety', '', '- This bundle does not publish to Threads, GitHub, YouTube, or any other external service.', '- Review public claims, URLs, media visibility, and credentials before publishing.', '');
  return `${lines.join('\n')}\n`;
}

export async function packageRelease({
  root,
  output,
  factsPath = null,
  qaPath = null,
  repositoryUrl = null,
  language = 'zh-TW',
  allowUnverified = false,
}) {
  if (!root) throw new Error('A release root directory is required.');
  const rootPath = path.resolve(root);
  const outputPath = path.resolve(output || path.join(rootPath, 'release'));
  await mkdir(outputPath, { recursive: true });

  const factsFile = factsPath ? path.resolve(factsPath) : path.join(rootPath, 'project-facts.json');
  const facts = await readOptionalJson(factsFile);
  const qaFile = qaPath ? path.resolve(qaPath) : (await readOptionalJson(path.join(rootPath, 'video-qa.json')) ? path.join(rootPath, 'video-qa.json') : path.join(rootPath, 'video', 'video-qa.json'));
  const qa = await readOptionalJson(qaFile);
  const qaComplete = Boolean(qa?.ok && Array.isArray(qa.checks) && qa.checks.length > 0 && qa.checks.every((check) => check.status === 'PASS'));
  const files = (await walkFiles(rootPath)).filter((relative) => !relative.startsWith('release' + path.sep));
  const classified = classifyArtifacts(files);
  const media = classified.filter((artifact) => ['video', 'audio', 'subtitle'].includes(artifact.kind));
  const textFiles = files.filter((file) => /\.(md|txt|json|srt|vtt|html|js|mjs|css|ya?ml)$/i.test(file));
  let secretCount = 0;
  for (const relative of textFiles) {
    try {
      secretCount += scanForSecrets(await readFile(path.join(rootPath, relative), 'utf8')).length;
    } catch {
      // Ignore transient files; the source QA stage should catch unreadable artifacts.
    }
  }
  if (secretCount > 0) throw new Error(`Release packaging stopped: ${secretCount} secret-like value(s) found in source artifacts.`);
  if (media.length > 0 && !qaComplete && !allowUnverified) {
    throw new Error('A complete passing video QA manifest is required before packaging media. Use --allow-unverified only for a review bundle.');
  }

  const artifactOutput = path.join(outputPath, 'artifacts');
  const artifacts = [];
  for (const artifact of classified) {
    if (artifact.kind === 'other') continue;
    const source = path.join(rootPath, artifact.path);
    const target = path.join(artifactOutput, artifact.path);
    await mkdir(path.dirname(target), { recursive: true });
    await copyPublicArtifact(source, target, rootPath);
    artifacts.push({
      target: path.relative(outputPath, target).replaceAll(path.sep, '/'),
      kind: artifact.kind,
      verified: artifact.kind === 'qa-report' || !['video', 'audio', 'subtitle'].includes(artifact.kind) || qaComplete,
    });
  }

  const threadsSource = buildThreadsSource(facts, { repositoryUrl, language });
  const threadPosts = splitThreadsPosts(threadsSource, 500);
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: facts?.identity || null,
    verification: qaComplete ? 'PASS' : 'UNVERIFIED',
    external_publish_required: true,
    artifacts,
    threads: {
      postCount: threadPosts.length,
      maxChars: 500,
      draftPath: 'threads-draft.md',
    },
  };
  await writeFile(path.join(outputPath, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(path.join(outputPath, 'RELEASE_README.md'), releaseReadme({ facts, artifacts, verified: qaComplete }), 'utf8');
  await writeFile(path.join(outputPath, 'threads-draft.md'), `${threadPosts.map((post, index) => `## Post ${index + 1}\n\n${redactSecrets(post)}`).join('\n\n')}\n`, 'utf8');

  return {
    output: outputPath,
    verification: manifest.verification,
    artifacts: artifacts.length,
    threadPosts: threadPosts.length,
    manifest: path.join(outputPath, 'release-manifest.json'),
    threadsDraft: path.join(outputPath, 'threads-draft.md'),
  };
}

async function main() {
  const { positionals, options } = parseOptions(process.argv.slice(2));
  const root = options.root || positionals[0];
  if (!root || options.help) {
    process.stdout.write('Usage: release-packager.mjs <promo-dir> [--out release-dir] [--facts project-facts.json] [--qa video-qa.json] [--repo-url url] [--allow-unverified] [--json]\n');
    return root ? 0 : 1;
  }
  const result = await packageRelease({
    root,
    output: options.out,
    factsPath: options.facts || null,
    qaPath: options.qa || null,
    repositoryUrl: options['repo-url'] || null,
    language: options.language || 'zh-TW',
    allowUnverified: Boolean(options['allow-unverified']),
  });
  process.stdout.write(options.json ? `${JSON.stringify(result, null, 2)}\n` : `Release bundle written to ${result.output}\nVerification: ${result.verification}\nArtifacts: ${result.artifacts}\nThreads posts: ${result.threadPosts}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`release-packager: ${error.message}\n`);
    process.exitCode = 1;
  });
}
