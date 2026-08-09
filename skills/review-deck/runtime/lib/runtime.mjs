import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const VERSION = '0.6.0';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(moduleDir, '..');
const templateRoot = path.join(pluginRoot, 'templates');
const supportedFormats = new Set(['html', 'marp', 'pptx']);
let catalogPromise;
let layoutCatalogPromise;

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
  return content.replace(/\{\{[A-Z][A-Z0-9_]*\}\}/g, (token) =>
    Object.hasOwn(values, token) ? values[token] : token,
  );
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
      await atomicWriteFile(destinationPath, replaceTokens(content, values));
    }
  }
}

async function atomicWriteFile(destination, content) {
  const temporary = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
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

function escapeHtmlText(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeHtmlAttribute(value) {
  return escapeHtmlText(value)
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('\r', '&#13;')
    .replaceAll('\n', '&#10;')
    .replaceAll('\t', '&#9;');
}

function escapeHtmlTemplateText(value) {
  return escapeHtmlText(value)
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;');
}

function escapeHtmlTemplateAttribute(value) {
  return escapeHtmlAttribute(value)
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;');
}

function escapeMarkdownInline(value) {
  return escapeHtmlText(value.replace(/\r\n?/g, '\n'))
    .replaceAll('\\', '\\\\')
    .replace(/([`*_{}\[\]()#+.!|>-])/g, '\\$1')
    .replaceAll('\n', '<br>');
}

function javascriptString(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003C')
    .replaceAll('>', '\\u003E')
    .replaceAll('&', '\\u0026')
    .replaceAll('{', '\\u007B')
    .replaceAll('}', '\\u007D')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function markdownYamlString(value) {
  return javascriptString(escapeMarkdownInline(value).replaceAll('<br>', ' '));
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function normalizeLanguage(language) {
  const requested = String(language ?? 'en-US').trim();
  if (!requested) throw new CliError('A language tag is required.');
  try {
    return Intl.getCanonicalLocales(requested)[0];
  } catch {
    throw new CliError(
      `Invalid language tag "${requested}". Use an Intl-compatible locale such as en-US or zh-TW.`,
    );
  }
}

async function canonicalPath(target) {
  let current = path.resolve(target);
  const missingSegments = [];

  while (true) {
    try {
      const existing = await realpath(current);
      return path.resolve(existing, ...missingSegments.reverse());
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      missingSegments.push(path.basename(current));
      current = parent;
    }
  }
}

function containsPath(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function assertSafeTemplateDestination(source, target) {
  const [canonicalSource, canonicalTarget] = await Promise.all([
    canonicalPath(source),
    canonicalPath(target),
  ]);
  if (containsPath(canonicalSource, canonicalTarget) || containsPath(canonicalTarget, canonicalSource)) {
    throw new CliError(
      `Destination overlaps the template source and cannot be used: ${target}`,
    );
  }
}

async function lstatIfPresent(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function assertSafeDestinationEntry(source, destination) {
  const destinationInfo = await lstatIfPresent(destination);
  if (!destinationInfo) return;
  if (destinationInfo.isSymbolicLink()) {
    throw new CliError(`Destination contains a symbolic link at a generated path: ${destination}`);
  }

  const sourceInfo = await lstat(source);
  if (sourceInfo.isDirectory()) {
    if (!destinationInfo.isDirectory()) {
      throw new CliError(`Destination path must be a directory: ${destination}`);
    }
    for (const entry of await readdir(source, { withFileTypes: true })) {
      await assertSafeDestinationEntry(
        path.join(source, entry.name),
        path.join(destination, entry.name),
      );
    }
  } else if (destinationInfo.isDirectory()) {
    throw new CliError(`Destination path must be a file: ${destination}`);
  } else if (!destinationInfo.isFile()) {
    throw new CliError(`Destination generated path must be a regular file: ${destination}`);
  } else if (destinationInfo.nlink > 1) {
    throw new CliError(`Destination generated path must not be a hard link: ${destination}`);
  }
}

async function assertSafeDestinationTree(source, target) {
  await assertSafeDestinationEntry(source, target);
  const metadataPath = path.join(target, 'template.json');
  const metadataInfo = await lstatIfPresent(metadataPath);
  if (metadataInfo?.isSymbolicLink()) {
    throw new CliError(`Destination contains a symbolic link at a generated path: ${metadataPath}`);
  }
  if (metadataInfo?.isDirectory()) {
    throw new CliError(`Destination path must be a file: ${metadataPath}`);
  }
  if (metadataInfo && !metadataInfo.isFile() && !metadataInfo.isSymbolicLink()) {
    throw new CliError(`Destination generated path must be a regular file: ${metadataPath}`);
  }
  if (metadataInfo?.isFile() && metadataInfo.nlink > 1) {
    throw new CliError(`Destination generated path must not be a hard link: ${metadataPath}`);
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

      const names = new Set();
      for (const template of catalog.templates) {
        for (const name of [template.name, ...(template.aliases || [])]) {
          if (names.has(name)) throw new CliError(`Duplicate template name or alias: ${name}`);
          names.add(name);
        }
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

async function loadLayoutCatalog() {
  layoutCatalogPromise ??= loadCatalog()
    .then((catalog) => readFile(path.join(templateRoot, catalog.layoutCatalog || 'layouts.json'), 'utf8'))
    .then(JSON.parse)
    .then((layouts) => {
      if (!Array.isArray(layouts.archetypes) || layouts.archetypes.length === 0) {
        throw new CliError('Layout catalog is empty.');
      }
      const names = layouts.archetypes.map((item) => item.name);
      if (new Set(names).size !== names.length) {
        throw new CliError('Layout catalog contains duplicate archetype names.');
      }
      for (const name of layouts.starterSequence || []) {
        if (!names.includes(name)) throw new CliError(`Unknown starter layout: ${name}`);
      }
      return layouts;
    })
    .catch((error) => {
      layoutCatalogPromise = undefined;
      if (error instanceof CliError) throw error;
      throw new CliError(`Unable to load layout catalog: ${error.message}`);
    });
  return layoutCatalogPromise;
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
        aliases: [...(template.aliases || [])],
        displayName: template.displayName,
        description: template.description,
        useCases: [...(template.useCases || [])],
        formats: [...template.formats],
        mode: template.mode,
        pattern: template.pattern,
        layoutSystem: template.layoutSystem,
        isDefault: template.name === catalog.default,
      })),
  };
}

export async function listLayouts({ family } = {}) {
  const catalog = await loadLayoutCatalog();
  const normalizedFamily = family?.trim().toLowerCase();
  return {
    name: catalog.name,
    displayName: catalog.displayName,
    description: catalog.description,
    rules: catalog.rules,
    starterSequence: [...catalog.starterSequence],
    archetypes: catalog.archetypes
      .filter((layout) => !normalizedFamily || layout.family === normalizedFamily)
      .map((layout) => ({
        name: layout.name,
        family: layout.family,
        description: layout.description,
        bestFor: [...layout.bestFor],
        cardBased: Boolean(layout.cardBased),
        formats: [...layout.formats],
      })),
  };
}

async function resolveTemplate(name, format) {
  const catalog = await loadCatalog();
  const requested = String(name || catalog.default).toLowerCase();
  const template = catalog.templates.find(
    (candidate) => candidate.name === requested || candidate.aliases?.includes(requested),
  );
  if (!template) {
    const available = catalog.templates.flatMap((candidate) => [
      candidate.name,
      ...(candidate.aliases || []),
    ]);
    throw new CliError(`Unknown template "${requested}". Available templates: ${available.join(', ')}.`);
  }
  if (!template.formats.includes(format)) {
    throw new CliError(
      `Template "${template.name}" does not support ${format}. Supported formats: ${template.formats.join(', ')}.`,
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

function rgbToHex(channels) {
  return `#${channels
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

function relativeLuminance(hex) {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first, second) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (left, right) => right - left,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function mixColor(first, second, amount) {
  const start = hexToRgb(first);
  const end = hexToRgb(second);
  return rgbToHex(start.map((channel, index) => channel + (end[index] - channel) * amount));
}

function bestForeground(backgroundColor, candidates) {
  return [...candidates].sort(
    (left, right) => contrastRatio(right, backgroundColor) - contrastRatio(left, backgroundColor),
  )[0];
}

function accessibleForeground(foreground, backgroundColor, candidates, minimum = 4.5) {
  if (contrastRatio(foreground, backgroundColor) >= minimum) return foreground;
  const fallback = bestForeground(backgroundColor, candidates);
  for (let step = 1; step <= 100; step += 1) {
    const mixed = mixColor(foreground, fallback, step / 100);
    if (contrastRatio(mixed, backgroundColor) >= minimum) return mixed;
  }
  return fallback;
}

function semanticTextColors(palette) {
  return {
    accentForeground: bestForeground(palette.accent, [palette.code, palette.codeText]),
    terminalAccent: accessibleForeground(
      palette.accent,
      palette.code,
      [palette.codeText, palette.canvas, palette.surface],
    ),
    successText: accessibleForeground(
      palette.success,
      palette.code,
      [palette.codeText, palette.canvas, palette.surface],
    ),
  };
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
  const { accentForeground, terminalAccent, successText } = semanticTextColors(p);
  const root = `:root {
  --canvas: ${p.canvas};
  --surface: ${p.surface};
  --ink: ${p.ink};
  --muted: ${p.muted};
  --border: ${p.border};
  --accent: ${p.accent};
  --accent-foreground: ${accentForeground};
  --terminal-accent: ${terminalAccent};
  --accent-soft: ${p.accentSoft};
  --code: ${p.code};
  --code-text: ${p.codeText};
  --success: ${p.success};
  --success-text: ${successText};
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
.slide--closing { background: var(--code); color: var(--code-text); }
.slide--closing::before { border-color: ${alpha(p.accent, 0.38)}; }
.slide h1, .slide h2 { font-weight: ${s.titleWeight}; letter-spacing: ${s.titleTracking}; }
.status, .proof-item, .state-panel, .architecture-layer, .flow-node, .metric-secondary, .evidence-visual, .comparison-table, .timeline-item, .risk-cell { border-radius: ${s.radius}; }
.status { background: ${alpha(p.surface, template.mode === 'dark' ? 0.18 : 0.78)}; }
.status-dot { box-shadow: 0 0 0 5px ${alpha(p.success, 0.14)}; }
.proof-item, .state-panel, .architecture-layer, .flow-stop, .metric-secondary, .evidence-visual, .comparison-table, .timeline-item, .risk-quadrant { background-color: ${alpha(p.surface, template.mode === 'dark' ? 0.2 : 0.82)}; }
.artifact-sidebar, .artifact-assistant { background: var(--accent-soft); }
.architecture-layer--accent, .risk-quadrant--hot { background: var(--accent-soft); }
`;
  }

  return `${marker}
${root}
section { ${background(template)} color: var(--ink); font-family: var(--font-body); }
section h1, section h2, section h3 { color: var(--ink); font-family: var(--font-display); font-weight: ${s.titleWeight}; letter-spacing: ${s.titleTracking}; }
.proof-rail strong, .index-number, .state > strong, .delta b, .metric-primary > strong, .metric-secondary strong, .flow-track strong, .artifact-content main > strong, .quote-grid blockquote, .timeline-track strong { font-family: var(--font-display); }
.index-list li > span, .state > span, .delta small, .layer span, .layer small, .metric-primary > span, .metric-secondary span, .chart-title, .bars > div, .flow-track span, .artifact-bar, .artifact-content main small, .artifact-content section b, .pin, .terminal-bar, .terminal pre, .quote-meta span, .quote-meta b, .compare-row.header > *, .timeline-track span, .risk-quadrants span, .risk-list span { font-family: var(--font-mono); }
header, footer, section::after, .eyebrow, .prompt-line, .node span, .arrow { font-family: var(--font-mono); }
.proof-item, .state-panel, .architecture-layer, .layer, .node, .metric-secondary, .evidence-visual, .chart, .comparison-table, .compare-table, .timeline-item, .risk-cell, .risk-quadrants, .terminal { border-radius: ${s.radius}; }
.proof-item, .state-panel, .architecture-layer, .layer, .node, .metric-secondary, .evidence-visual, .chart, .comparison-table, .compare-table, .timeline-item, .risk-cell, .risk-quadrants { background: ${alpha(p.surface, template.mode === 'dark' ? 0.2 : 0.82)}; }
.artifact-content aside, .artifact-content section { background: var(--accent-soft); }
.terminal { border-color: var(--border); }
.prompt { color: var(--terminal-accent); }
`;
}

async function applyTemplate(target, format, template, language) {
  const [catalog, layouts] = await Promise.all([loadCatalog(), loadLayoutCatalog()]);
  const metadata = {
    schemaVersion: 2,
    pluginVersion: VERSION,
    templateCatalogVersion: catalog.version,
    layoutCatalogVersion: layouts.version,
    name: template.name,
    aliases: template.aliases || [],
    displayName: template.displayName,
    description: template.description,
    useCases: template.useCases,
    format,
    mode: template.mode,
    pattern: template.pattern,
    palette: template.palette,
    fonts: template.fonts,
    shape: template.shape,
    language,
    layoutSystem: {
      name: layouts.name,
      displayName: layouts.displayName,
      rules: layouts.rules,
      starterSequence: layouts.starterSequence,
      archetypes: layouts.archetypes.map((layout) => layout.name),
    },
  };
  await atomicWriteFile(path.join(target, 'template.json'), `${JSON.stringify(metadata, null, 2)}\n`);

  if (format === 'html' || format === 'marp') {
    const themePath = path.join(target, 'theme.css');
    const baseTheme = await readFile(path.join(templateRoot, format, 'theme.css'), 'utf8');
    await atomicWriteFile(themePath, `${baseTheme}\n\n${buildCss(template, format)}`);
  }
}

export async function initDeck({
  title,
  format = 'html',
  template,
  destination,
  force = false,
  language = 'en-US',
  cwd = process.cwd(),
}) {
  if (!title?.trim()) throw new CliError('A deck title is required.');
  if (!supportedFormats.has(format)) {
    throw new CliError(`Unsupported format "${format}". Use html, marp, or pptx.`);
  }

  const selected = await resolveTemplate(template, format);
  const normalizedTitle = title.trim();
  const normalizedLanguage = normalizeLanguage(language);
  const slug = slugify(normalizedTitle);
  const target = path.resolve(cwd, destination || path.join('slides', slug));
  const source = path.join(templateRoot, format);

  if (!existsSync(source)) throw new CliError(`Template base not found for format: ${format}`);
  await assertSafeTemplateDestination(source, target);
  await assertSafeDestinationTree(source, target);
  if (existsSync(target) && !(await isDirectoryEmpty(target)) && !force) {
    throw new CliError(
      `Destination is not empty: ${target}\nUse --force to overwrite template files while preserving unrelated files.`,
    );
  }

  const now = new Date();
  const p = selected.palette;
  const f = selected.fonts;
  const { accentForeground, terminalAccent, successText } = semanticTextColors(p);
  await copyTemplateDirectory(source, target, {
    '{{TITLE_HTML_TEXT}}': escapeHtmlTemplateText(normalizedTitle),
    '{{TITLE_HTML_ATTR}}': escapeHtmlTemplateAttribute(normalizedTitle),
    '{{TITLE_JS}}': javascriptString(normalizedTitle),
    '{{TITLE_YAML}}': markdownYamlString(normalizedTitle),
    '{{TITLE_MARKDOWN}}': escapeMarkdownInline(normalizedTitle),
    '{{SLUG}}': slug,
    '{{DATE}}': now.toISOString().slice(0, 10),
    '{{YEAR}}': String(now.getUTCFullYear()),
    '{{OUTPUT_FILE}}': `${slug}.pptx`,
    '{{OUTPUT_FILE_JS}}': javascriptString(`${slug}.pptx`),
    '{{TEMPLATE_ID}}': selected.name,
    '{{TEMPLATE_NAME}}': selected.displayName,
    '{{TEMPLATE_ID_MARKDOWN}}': escapeMarkdownInline(selected.name),
    '{{TEMPLATE_ID_MARKDOWN_CODE}}': selected.name,
    '{{TEMPLATE_NAME_HTML_TEXT}}': escapeHtmlText(selected.displayName),
    '{{TEMPLATE_NAME_MARKDOWN}}': escapeMarkdownInline(selected.displayName),
    '{{TEMPLATE_NAME_JS}}': javascriptString(selected.displayName),
    '{{LANG_HTML_ATTR}}': escapeHtmlAttribute(normalizedLanguage),
    '{{LANGUAGE_JS}}': javascriptString(normalizedLanguage),
    '{{LANGUAGE_YAML}}': javascriptString(normalizedLanguage),
    '{{LANGUAGE_MARKDOWN_CODE}}': normalizedLanguage,
    '{{COLOR_SCHEME_HTML_ATTR}}': escapeHtmlAttribute(selected.mode),
    '{{ACCENT}}': p.accent,
    '{{ACCENT_FOREGROUND}}': accentForeground,
    '{{TERMINAL_ACCENT}}': terminalAccent,
    '{{ACCENT_SOFT}}': p.accentSoft,
    '{{INK}}': p.ink,
    '{{MUTED}}': p.muted,
    '{{CANVAS}}': p.canvas,
    '{{SURFACE}}': p.surface,
    '{{BORDER}}': p.border,
    '{{CODE}}': p.code,
    '{{CODE_TEXT}}': p.codeText,
    '{{SUCCESS}}': p.success,
    '{{SUCCESS_TEXT}}': successText,
    '{{WARNING}}': p.warning,
    '{{PPTX_CANVAS_JS}}': javascriptString(p.canvas.slice(1).toUpperCase()),
    '{{PPTX_SURFACE_JS}}': javascriptString(p.surface.slice(1).toUpperCase()),
    '{{PPTX_INK_JS}}': javascriptString(p.ink.slice(1).toUpperCase()),
    '{{PPTX_MUTED_JS}}': javascriptString(p.muted.slice(1).toUpperCase()),
    '{{PPTX_BORDER_JS}}': javascriptString(p.border.slice(1).toUpperCase()),
    '{{PPTX_ACCENT_JS}}': javascriptString(p.accent.slice(1).toUpperCase()),
    '{{PPTX_ACCENT_FOREGROUND_JS}}': javascriptString(accentForeground.slice(1).toUpperCase()),
    '{{PPTX_ACCENT_SOFT_JS}}': javascriptString(p.accentSoft.slice(1).toUpperCase()),
    '{{PPTX_CODE_JS}}': javascriptString(p.code.slice(1).toUpperCase()),
    '{{PPTX_CODE_TEXT_JS}}': javascriptString(p.codeText.slice(1).toUpperCase()),
    '{{PPTX_SUCCESS_JS}}': javascriptString(p.success.slice(1).toUpperCase()),
    '{{PPTX_SUCCESS_TEXT_JS}}': javascriptString(successText.slice(1).toUpperCase()),
    '{{PPTX_WARNING_JS}}': javascriptString(p.warning.slice(1).toUpperCase()),
    '{{PPTX_DISPLAY_FONT_JS}}': javascriptString(f.pptxDisplay),
    '{{PPTX_BODY_FONT_JS}}': javascriptString(f.pptxBody),
    '{{PPTX_MONO_FONT_JS}}': javascriptString(f.pptxMono),
  });
  await applyTemplate(target, format, selected, normalizedLanguage);

  return {
    title: normalizedTitle,
    slug,
    format,
    language: normalizedLanguage,
    template: selected.name,
    templateDisplayName: selected.displayName,
    target,
    next:
      format === 'html'
        ? `Open ${path.join(target, 'index.html')} in a browser, or serve ${target} locally.`
        : format === 'marp'
          ? `Run: cd ${shellQuote(target)} && npx @marp-team/marp-cli@latest deck.md --theme theme.css --html`
          : `Run: cd ${shellQuote(target)} && npm install && npm run build`,
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

function probePython() {
  const result = probe('python3');
  if (!result.available) return result;
  const match = result.detail.match(/Python\s+(\d+)\.(\d+)/i);
  const compatible = match
    ? Number(match[1]) > 3 || (Number(match[1]) === 3 && Number(match[2]) >= 10)
    : false;
  return { available: compatible, detail: result.detail };
}

export function doctor() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  const nodeAvailable = major > 18 || (major === 18 && minor >= 3);
  const python = probePython();
  return {
    ok: nodeAvailable,
    node: { available: nodeAvailable, detail: process.version },
    python,
    capabilities: { pythonSvg: python.available },
    codex: probe('codex'),
    claude: probe('claude'),
    npx: probe('npx'),
  };
}
