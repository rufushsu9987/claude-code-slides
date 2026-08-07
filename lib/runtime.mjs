import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const VERSION = '0.5.0';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(moduleDir, '..');
const templateRoot = path.join(pluginRoot, 'templates');
const supportedFormats = new Set(['html', 'marp', 'pptx']);
let catalogPromise;

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

function replaceTokens(content, values) {
  let result = content;
  for (const [token, replacement] of Object.entries(values)) {
    result = result.split(token).join(replacement);
  }
  return result;
}

async function copyTemplateDirectory(source, destination, values) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyTemplateDirectory(sourcePath, destinationPath, values);
    } else {
      const content = await readFile(sourcePath, 'utf8');
      await writeFile(destinationPath, replaceTokens(content, values), 'utf8');
    }
  }
}

async function isDirectoryEmpty(directory) {
  try {
    return (await readdir(directory)).length === 0;
  } catch (error) {
    if (error?.code === 'ENOENT') return true;
    throw error;
  }
}

async function loadCatalog() {
  catalogPromise ??= readFile(path.join(templateRoot, 'catalog.json'), 'utf8')
    .then(JSON.parse)
    .then((catalog) => {
      if (!Array.isArray(catalog.templates) || catalog.templates.length === 0) {
        throw new CliError('Template catalog is empty.');
      }
      if (!catalog.templates.some((item) => item.name === catalog.default)) {
        throw new CliError(`Template catalog default "${catalog.default}" is missing.`);
      }
      return catalog;
    })
    .catch((error) => {
      catalogPromise = undefined;
      if (error instanceof CliError) throw error;
      throw new CliError(`Unable to load template catalog: ${error.message}`);
    });
  return catalogPromise;
}

export async function listTemplates({ format } = {}) {
  if (format && !supportedFormats.has(format)) {
    throw new CliError(`Unsupported format "${format}". Use html, marp, or pptx.`);
  }
  const catalog = await loadCatalog();
  return {
    default: catalog.default,
    templates: catalog.templates
      .filter((template) => !format || template.formats.includes(format))
      .map((template) => ({
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        useCases: [...(template.useCases || [])],
        formats: [...template.formats],
        mode: template.mode,
        pattern: template.pattern,
        isDefault: template.name === catalog.default,
      })),
  };
}

async function resolveTemplate(name, format) {
  const catalog = await loadCatalog();
  const requested = name || catalog.default;
  const template = catalog.templates.find((candidate) => candidate.name === requested);
  if (!template) {
    throw new CliError(
      `Unknown template "${requested}". Available templates: ${catalog.templates
        .map((candidate) => candidate.name)
        .join(', ')}.`,
    );
  }
  if (!template.formats.includes(format)) {
    throw new CliError(
      `Template "${requested}" does not support ${format}. Supported formats: ${template.formats.join(', ')}.`,
    );
  }
  return template;
}

function hexToRgb(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function alpha(hex, opacity) {
  const [red, green, blue] = hexToRgb(hex);
  return `rgb(${red} ${green} ${blue} / ${Math.round(opacity * 100)}%)`;
}

function background(template) {
  const { palette: p, pattern } = template;
  const patterns = {
    clean: `linear-gradient(180deg, ${alpha(p.accent, 0.055)}, transparent 34%), var(--canvas)`,
    blueprint: `linear-gradient(${alpha(p.accent, 0.09)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(p.accent, 0.09)} 1px, transparent 1px), linear-gradient(${alpha(p.ink, 0.04)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(p.ink, 0.04)} 1px, transparent 1px), var(--canvas)`,
    dots: `radial-gradient(circle, ${alpha(p.accent, 0.16)} 1.4px, transparent 1.6px), var(--canvas)`,
    spotlight: `radial-gradient(circle at 84% 12%, ${alpha(p.accent, 0.17)}, transparent 34%), radial-gradient(circle at 12% 88%, ${alpha(p.accentSoft, 0.55)}, transparent 32%), var(--canvas)`,
    'dark-grid': `linear-gradient(${alpha(p.codeText, 0.045)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(p.codeText, 0.045)} 1px, transparent 1px), radial-gradient(circle at 82% 12%, ${alpha(p.accent, 0.13)}, transparent 30%), var(--canvas)`,
    signal: `linear-gradient(90deg, ${alpha(p.accent, 0.12)} 0 8px, transparent 8px), linear-gradient(${alpha(p.ink, 0.035)} 1px, transparent 1px), var(--canvas)`,
    grid: `linear-gradient(${alpha(p.ink, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(p.ink, 0.03)} 1px, transparent 1px), var(--canvas)`,
  };
  const sizes = {
    blueprint: '32px 32px, 32px 32px, 160px 160px, 160px 160px, auto',
    dots: '32px 32px, auto',
    'dark-grid': '64px 64px, 64px 64px, auto, auto',
    signal: 'auto, 100% 56px, auto',
    grid: '64px 64px, 64px 64px, auto',
  };
  return `background: ${patterns[pattern] || patterns.grid};\n  background-size: ${sizes[pattern] || 'auto'};`;
}

function buildCss(template, format) {
  const { palette: p, fonts: f, shape: s } = template;
  const root = `:root {
  --canvas: ${p.canvas};
  --surface: ${p.surface};
  --ink: ${p.ink};
  --muted: ${p.muted};
  --border: ${p.border};
  --accent: ${p.accent};
  --accent-soft: ${p.accentSoft};
  --code: ${p.code};
  --code-text: ${p.codeText};
  --success: ${p.success};
  --warning: ${p.warning};
  --font-display: ${f.cssDisplay};
  --font-body: ${f.cssBody};
  --font-mono: ${f.cssMono};
  color-scheme: ${template.mode};
}`;
  const marker = `/* template-preset: ${template.name} (${template.displayName}) */`;

  if (format === 'html') {
    const ornament =
      template.pattern === 'clean'
        ? '.slide::before { display: none; }'
        : `.slide::before { border-color: ${alpha(p.accent, 0.24)}; box-shadow: 0 0 0 100px ${alpha(p.accent, 0.03)}, 0 0 0 200px ${alpha(p.accent, 0.02)}; }`;
    return `${marker}
${root}
body { background: ${template.mode === 'dark' ? '#050607' : p.code}; }
.slide { ${background(template)} }
${ornament}
.slide h1, .slide h2 { font-weight: ${s.titleWeight}; letter-spacing: ${s.titleTracking}; }
.status, .metric-card, .flow-node, .compare-card { border-radius: ${s.radius}; }
.status { background: ${alpha(p.surface, template.mode === 'dark' ? 0.18 : 0.78)}; }
.status-dot { box-shadow: 0 0 0 5px ${alpha(p.success, 0.14)}; }
`;
  }

  return `${marker}
${root}
section { ${background(template)} color: var(--ink); font-family: var(--font-body); }
h1, h2, h3 { color: var(--ink); font-family: var(--font-display); font-weight: ${s.titleWeight}; letter-spacing: ${s.titleTracking}; }
header, footer, section::after, .eyebrow, .prompt-line, .node span, .arrow { font-family: var(--font-mono); }
.metric, .node, .prompt-line, .terminal { border-radius: ${s.radius}; }
.metric, .node { background: ${alpha(p.surface, template.mode === 'dark' ? 0.2 : 0.82)}; }
.terminal { border-color: var(--border); }
.prompt { color: var(--accent); }
`;
}

function stripHash(value) {
  return value.slice(1).toUpperCase();
}

function replaceRequired(content, search, replacement) {
  if (!content.includes(search)) {
    throw new CliError(`PPTX base is missing replaceable token: ${search}`);
  }
  return content.split(search).join(replacement);
}

async function applyPptxTemplate(target, template) {
  const deckPath = path.join(target, 'deck.mjs');
  let content = await readFile(deckPath, 'utf8');
  const p = template.palette;
  const f = template.fonts;
  const replacements = [
    ["headFontFace: 'Georgia'", `headFontFace: '${f.pptxDisplay}'`],
    ["bodyFontFace: 'Aptos'", `bodyFontFace: '${f.pptxBody}'`],
    ["display: 'Georgia'", `display: '${f.pptxDisplay}'`],
    ["body: 'Aptos'", `body: '${f.pptxBody}'`],
    ["mono: 'Aptos Mono'", `mono: '${f.pptxMono}'`],
    ["canvas: 'F7F3EC'", `canvas: '${stripHash(p.canvas)}'`],
    ["surface: 'FFFDF9'", `surface: '${stripHash(p.surface)}'`],
    ["ink: '211F1B'", `ink: '${stripHash(p.ink)}'`],
    ["muted: '6F6962'", `muted: '${stripHash(p.muted)}'`],
    ["border: 'D8D0C6'", `border: '${stripHash(p.border)}'`],
    ["accent: 'D97757'", `accent: '${stripHash(p.accent)}'`],
    ["accentSoft: 'F1D9CD'", `accentSoft: '${stripHash(p.accentSoft)}'`],
    ["code: '27241F'", `code: '${stripHash(p.code)}'`],
    ["codeText: 'F8F3EA'", `codeText: '${stripHash(p.codeText)}'`],
    ["success: '7FB08A'", `success: '${stripHash(p.success)}'`],
  ];
  for (const [search, replacement] of replacements) {
    content = replaceRequired(content, search, replacement);
  }
  await writeFile(deckPath, content, 'utf8');
}

async function applyTemplate(target, format, template) {
  const metadata = {
    schemaVersion: 1,
    name: template.name,
    displayName: template.displayName,
    description: template.description,
    useCases: template.useCases,
    format,
    mode: template.mode,
    pattern: template.pattern,
    palette: template.palette,
    fonts: template.fonts,
    shape: template.shape,
  };
  await writeFile(path.join(target, 'template.json'), `${JSON.stringify(metadata, null, 2)}\n`);

  if (format === 'html' || format === 'marp') {
    await appendFile(path.join(target, 'theme.css'), `\n\n${buildCss(template, format)}`);
  } else {
    await applyPptxTemplate(target, template);
  }
}

export async function initDeck({
  title,
  format = 'html',
  template,
  destination,
  force = false,
  cwd = process.cwd(),
}) {
  if (!title?.trim()) throw new CliError('A deck title is required.');
  if (!supportedFormats.has(format)) {
    throw new CliError(`Unsupported format "${format}". Use html, marp, or pptx.`);
  }

  const selected = await resolveTemplate(template, format);
  const slug = slugify(title);
  const target = path.resolve(cwd, destination || path.join('slides', slug));
  const source = path.join(templateRoot, format);

  if (!existsSync(source)) throw new CliError(`Template base not found for format: ${format}`);
  if (existsSync(target) && !(await isDirectoryEmpty(target)) && !force) {
    throw new CliError(
      `Destination is not empty: ${target}\nUse --force to overwrite template files while preserving unrelated files.`,
    );
  }

  const now = new Date();
  await copyTemplateDirectory(source, target, {
    '{{TITLE}}': title.trim(),
    '{{SLUG}}': slug,
    '{{DATE}}': now.toISOString().slice(0, 10),
    '{{YEAR}}': String(now.getUTCFullYear()),
    '{{OUTPUT_FILE}}': `${slug}.pptx`,
    '{{TEMPLATE_ID}}': selected.name,
    '{{TEMPLATE_NAME}}': selected.displayName,
  });
  await applyTemplate(target, format, selected);

  return {
    title: title.trim(),
    slug,
    format,
    template: selected.name,
    templateDisplayName: selected.displayName,
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
