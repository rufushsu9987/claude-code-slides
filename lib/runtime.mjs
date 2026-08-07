import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const VERSION = '0.3.0';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(moduleDir, '..');
const templateRoot = path.join(pluginRoot, 'templates');
const supportedFormats = new Set(['html', 'marp', 'pptx']);

export class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

export function slugify(value) {
  const slug = value
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return slug || 'presentation';
}

function tokenValues(title, slug) {
  const now = new Date();
  return {
    '{{TITLE}}': title,
    '{{SLUG}}': slug,
    '{{DATE}}': now.toISOString().slice(0, 10),
    '{{YEAR}}': String(now.getUTCFullYear()),
    '{{OUTPUT_FILE}}': `${slug}.pptx`,
  };
}

function replaceTokens(content, values) {
  let result = content;
  for (const [token, replacement] of Object.entries(values)) {
    result = result.split(token).join(replacement);
  }
  return result;
}

async function isDirectoryEmpty(directory) {
  try {
    const entries = await readdir(directory);
    return entries.length === 0;
  } catch (error) {
    if (error?.code === 'ENOENT') return true;
    throw error;
  }
}

async function copyTemplateDirectory(source, destination, values) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyTemplateDirectory(sourcePath, destinationPath, values);
      continue;
    }

    const content = await readFile(sourcePath, 'utf8');
    await writeFile(destinationPath, replaceTokens(content, values), 'utf8');
  }
}

export async function initDeck({
  title,
  format = 'html',
  destination,
  force = false,
  cwd = process.cwd(),
}) {
  if (!title?.trim()) throw new CliError('A deck title is required.');
  if (!supportedFormats.has(format)) {
    throw new CliError(`Unsupported format "${format}". Use html, marp, or pptx.`);
  }

  const slug = slugify(title);
  const target = path.resolve(cwd, destination || path.join('slides', slug));
  const source = path.join(templateRoot, format);

  if (!existsSync(source)) throw new CliError(`Template not found for format: ${format}`);

  if (existsSync(target) && !(await isDirectoryEmpty(target)) && !force) {
    throw new CliError(
      `Destination is not empty: ${target}\nUse --force to overwrite template files while preserving unrelated files.`,
    );
  }

  await copyTemplateDirectory(source, target, tokenValues(title.trim(), slug));

  return {
    title: title.trim(),
    slug,
    format,
    target,
    next:
      format === 'html'
        ? `Open ${path.join(target, 'index.html')} in a browser, or serve ${target} locally.`
        : format === 'marp'
          ? `Run: cd ${JSON.stringify(target)} && npx @marp-team/marp-cli@latest deck.md --theme theme.css --html`
          : `Run: cd ${JSON.stringify(target)} && npm install && npm run build`,
  };
}

function probe(command, args = ['--version']) {
  const result = spawnSync(command, args, { encoding: 'utf8', shell: false });
  if (result.error) return { available: false, detail: result.error.message };
  return {
    available: result.status === 0,
    detail: (result.stdout || result.stderr || '').trim().split(/\r?\n/, 1)[0],
  };
}

export function doctor() {
  const major = Number(process.versions.node.split('.')[0]);
  return {
    ok: major >= 18,
    node: { available: major >= 18, detail: process.version },
    codex: probe('codex'),
    claude: probe('claude'),
    npx: probe('npx'),
  };
}
