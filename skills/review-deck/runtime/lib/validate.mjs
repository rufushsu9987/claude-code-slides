import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { CliError } from './runtime.mjs';

const supportedFormats = new Set(['html', 'marp', 'pptx']);
const layoutCatalog = JSON.parse(
  await readFile(new URL('../templates/layouts.json', import.meta.url), 'utf8'),
);
const layoutByName = new Map(
  layoutCatalog.archetypes.map((archetype) => [archetype.name, archetype]),
);
const layoutRules = layoutCatalog.rules || {};
const maximumLocalTextAssetBytes = 10 * 1024 * 1024;

function issue(level, code, message, file, details = {}) {
  return { level, code, message, file, ...details };
}

function stripHtmlComments(content) {
  return content.replace(/<!--[\s\S]*?-->/g, '');
}

function stripJavaScriptComments(content) {
  let output = '';
  let state = 'code';
  let quote;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const next = content[index + 1];

    if (state === 'line-comment') {
      if (character === '\n' || character === '\r') {
        output += character;
        state = 'code';
      } else {
        output += ' ';
      }
      continue;
    }

    if (state === 'block-comment') {
      if (character === '*' && next === '/') {
        output += '  ';
        index += 1;
        state = 'code';
      } else {
        output += character === '\n' || character === '\r' ? character : ' ';
      }
      continue;
    }

    if (state === 'string') {
      output += character;
      if (character === '\\') {
        if (next !== undefined) {
          output += next;
          index += 1;
        }
      } else if (character === quote) {
        state = 'code';
        quote = undefined;
      }
      continue;
    }

    if (character === '/' && next === '/') {
      output += '  ';
      index += 1;
      state = 'line-comment';
    } else if (character === '/' && next === '*') {
      output += '  ';
      index += 1;
      state = 'block-comment';
    } else {
      output += character;
      if (character === "'" || character === '"' || character === '`') {
        state = 'string';
        quote = character;
      }
    }
  }

  return output;
}

function findPlaceholderIssues(content, file) {
  const findings = [];
  const patterns = [
    { regex: /\{\{[A-Z0-9_]+\}\}/g, label: 'unresolved template token' },
    { regex: /\b(?:TODO|TBD|FIXME)\b/gi, label: 'unfinished placeholder' },
    { regex: /lorem ipsum/gi, label: 'placeholder copy' },
    { regex: /\bReplace this\b/gi, label: 'starter copy' },
  ];

  for (const { regex, label } of patterns) {
    const matches = content.match(regex);
    if (matches?.length) {
      findings.push(
        issue('warning', 'placeholder', `${label}: ${[...new Set(matches)].join(', ')}`, file),
      );
    }
  }

  return findings;
}

function percentage(value) {
  return `${Math.round(value * 100)}%`;
}

function repeatedRuns(values, maximum, describe) {
  if (!Number.isFinite(maximum) || maximum < 1) return [];
  const runs = [];
  let start = 0;

  for (let index = 1; index <= values.length; index += 1) {
    if (index < values.length && values[index] && values[index] === values[start]) continue;
    const length = index - start;
    if (values[start] && length > maximum) {
      runs.push(`${start + 1}–${index} (${describe(values[start])})`);
    }
    start = index;
  }

  return runs;
}

function isSplitGeometry(geometry) {
  return typeof geometry === 'string' && /(?:^|-)split(?:-|$)/i.test(geometry);
}

function layoutDiversityIssues(sequence, geometries, file, slideCount = sequence.length) {
  const warnings = [];
  if (!sequence.some(Boolean)) return warnings;

  const unknown = [...new Set(sequence.filter((name) => name && !layoutByName.has(name)))];
  if (unknown.length) {
    warnings.push(
      issue(
        'warning',
        'layout-archetype',
        `Unknown layout archetype marker(s): ${unknown.join(', ')}`,
        file,
      ),
    );
  }

  if (slideCount < 10) return warnings;

  const repeats = repeatedRuns(
    sequence,
    layoutRules.maximumConsecutiveSame,
    (name) => name,
  );
  if (repeats.length) {
    warnings.push(
      issue(
        'warning',
        'layout-repeat',
        `Layout runs exceed the catalog maximum of ${layoutRules.maximumConsecutiveSame}: slides ${repeats.join(', ')}.`,
        file,
      ),
    );
  }

  if (Number.isFinite(layoutRules.minimumUniqueForTenSlides)) {
    const unique = new Set(sequence.filter((name) => layoutByName.has(name))).size;
    if (unique < layoutRules.minimumUniqueForTenSlides) {
      warnings.push(
        issue(
          'warning',
          'layout-diversity',
          `Deck uses ${unique} known layout archetype(s) across ${slideCount} slides; target at least ${layoutRules.minimumUniqueForTenSlides}.`,
          file,
        ),
      );
    }
  }

  const cardCount = sequence.filter((name) => layoutByName.get(name)?.cardBased === true).length;
  if (
    Number.isFinite(layoutRules.maximumCardShare) &&
    cardCount / slideCount > layoutRules.maximumCardShare
  ) {
    warnings.push(
      issue(
        'warning',
        'layout-card-share',
        `Card-based layouts occupy ${cardCount}/${slideCount} slides; the catalog maximum is ${percentage(layoutRules.maximumCardShare)}.`,
        file,
      ),
    );
  }

  const resolvedGeometries = sequence.map(
    (name, index) => geometries[index] || layoutByName.get(name)?.geometry,
  );
  const splitCount = resolvedGeometries.filter(isSplitGeometry).length;
  if (
    Number.isFinite(layoutRules.maximumSplitShare) &&
    splitCount / slideCount > layoutRules.maximumSplitShare
  ) {
    warnings.push(
      issue(
        'warning',
        'layout-split-share',
        `Split-screen geometries occupy ${splitCount}/${slideCount} slides; the catalog maximum is ${percentage(layoutRules.maximumSplitShare)}.`,
        file,
      ),
    );
  }

  const geometryRuns = repeatedRuns(
    resolvedGeometries,
    layoutRules.maximumSameGeometryRun,
    (geometry) => geometry,
  );
  if (geometryRuns.length) {
    warnings.push(
      issue(
        'warning',
        'layout-geometry-run',
        `Geometry runs exceed the catalog maximum of ${layoutRules.maximumSameGeometryRun}: slides ${geometryRuns.join(', ')}.`,
        file,
      ),
    );
  }

  const rhythmWindow = layoutRules.rhythmChangeEvery;
  if (Number.isFinite(rhythmWindow) && rhythmWindow > 1) {
    const families = sequence.map((name) => layoutByName.get(name)?.family);
    for (let index = 0; index <= families.length - rhythmWindow; index += 1) {
      const window = families.slice(index, index + rhythmWindow);
      if (window.every(Boolean) && new Set(window).size === 1) {
        warnings.push(
          issue(
            'warning',
            'layout-family-rhythm',
            `Slides ${index + 1}–${index + rhythmWindow} all use the ${window[0]} layout family; the catalog calls for a rhythm change every ${rhythmWindow} slides.`,
            file,
          ),
        );
        break;
      }
    }

    const rhythmRuns = repeatedRuns(families, rhythmWindow, (family) => family);
    if (rhythmRuns.length) {
      warnings.push(
        issue(
          'warning',
          'layout-rhythm-change',
          `Layout-family runs go longer than the catalog rhythm interval of ${rhythmWindow}: slides ${rhythmRuns.join(', ')}.`,
          file,
        ),
      );
    }
  }

  return warnings;
}

function localReference(value) {
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  ) {
    return undefined;
  }

  const suffix = trimmed.search(/[?#]/);
  const reference = (suffix === -1 ? trimmed : trimmed.slice(0, suffix)).trim();
  return reference || undefined;
}

function localReferences(content, attribute) {
  const references = [];
  const regex = new RegExp(`${attribute}=["']([^"']+)["']`, 'gi');
  for (const match of content.matchAll(regex)) {
    const reference = localReference(match[1]);
    if (reference) references.push(reference);
  }
  return references;
}

function isPathContained(baseDirectory, candidate) {
  const relative = path.relative(baseDirectory, candidate);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}

async function localReferenceContext(baseDirectory) {
  const lexicalBase = path.resolve(baseDirectory);
  return { lexicalBase, realBase: await realpath(lexicalBase) };
}

async function inspectLocalReference(reference, context) {
  const lexicalPath = path.resolve(context.lexicalBase, reference);
  if (!isPathContained(context.lexicalBase, lexicalPath)) {
    return { status: 'unsafe', reference, reason: 'path escapes the deck directory' };
  }

  let realPath;
  try {
    realPath = await realpath(lexicalPath);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      return { status: 'missing', reference };
    }
    return { status: 'invalid', reference, reason: error.message };
  }

  if (!isPathContained(context.realBase, realPath)) {
    return { status: 'unsafe', reference, reason: 'resolved path escapes the deck directory' };
  }

  let info;
  try {
    info = await stat(realPath);
    if (info.isDirectory()) {
      return { status: 'directory', reference, path: realPath, reason: 'target is a directory' };
    }
    if (!info.isFile()) return { status: 'invalid', reference, reason: 'target is not a regular file' };
  } catch (error) {
    return { status: 'invalid', reference, reason: error.message };
  }

  return { status: 'file', reference, path: realPath, size: info.size };
}

function localReferenceError(record, file) {
  if (record.status === 'missing') {
    return issue('error', 'missing-asset', `Missing local asset: ${record.reference}`, file);
  }
  if (record.status === 'unsafe') {
    return issue(
      'error',
      'unsafe-asset',
      `Unsafe local asset path: ${record.reference} (${record.reason}).`,
      file,
    );
  }
  return issue(
    'error',
    'invalid-asset',
    `Invalid local asset: ${record.reference} (${record.reason}).`,
    file,
  );
}

async function validateLocalReferences(references, context, file, { allowDirectories = false } = {}) {
  const records = new Map();
  const errors = [];
  for (const reference of new Set(references)) {
    const record = await inspectLocalReference(reference, context);
    records.set(reference, record);
    if (record.status !== 'file' && !(allowDirectories && record.status === 'directory')) {
      errors.push(localReferenceError(record, file));
    }
  }
  return { records, errors };
}

function localTextAssetWithinLimit(record, file, errors) {
  if (record.size <= maximumLocalTextAssetBytes) return true;
  errors.push(
    issue(
      'error',
      'invalid-asset',
      `Local text asset ${record.reference} exceeds the 10 MiB read limit.`,
      file,
    ),
  );
  return false;
}

async function inspectHtml(file) {
  const content = await readFile(file, 'utf8');
  const structureContent = stripHtmlComments(content);
  const base = path.dirname(file);
  const referenceContext = await localReferenceContext(base);
  const errors = [];
  const warnings = [...findPlaceholderIssues(content, file)];
  const sections = structureContent.match(/<section\b[\s\S]*?<\/section>/gi) || [];
  const slideSections = sections.filter((section) => /class=["'][^"']*\bslide\b/i.test(section));

  if (!/<meta\s+name=["']viewport["']/i.test(structureContent)) {
    warnings.push(issue('warning', 'viewport', 'Missing viewport meta tag.', file));
  }
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(structureContent)) {
    warnings.push(issue('warning', 'language', 'Missing document language.', file));
  }
  if (slideSections.length === 0) {
    errors.push(issue('error', 'slides', 'No <section class="slide"> elements found.', file));
  }

  slideSections.forEach((section, index) => {
    if (!/<h[1-3]\b/i.test(section)) {
      warnings.push(
        issue('warning', 'heading', `Slide ${index + 1} has no h1, h2, or h3 heading.`, file, {
          slide: index + 1,
        }),
      );
    }
  });

  const layoutRecords = slideSections.map((section) => ({
    layout: section.match(/\bdata-layout=["']([^"']+)["']/i)?.[1],
    geometry: section.match(/\bdata-geometry=["']([^"']+)["']/i)?.[1],
  }));
  const layoutSequence = layoutRecords.map((record) => record.layout);
  const geometrySequence = layoutRecords.map((record) => record.geometry);
  const markedLayoutCount = layoutSequence.filter(Boolean).length;
  const resolvedGeometrySequence = layoutSequence
    .map((name, index) => geometrySequence[index] || layoutByName.get(name)?.geometry)
    .filter(Boolean);
  if (slideSections.length && markedLayoutCount !== slideSections.length) {
    warnings.push(
      issue(
        'warning',
        'layout-marker',
        `${slideSections.length - markedLayoutCount} HTML slide(s) are missing data-layout markers.`,
        file,
      ),
    );
  }
  warnings.push(
    ...layoutDiversityIssues(layoutSequence, geometrySequence, file, slideSections.length),
  );

  for (const image of structureContent.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=["'][^"']+["']/i.test(image[0])) {
      warnings.push(issue('warning', 'alt-text', 'Image is missing meaningful alt text.', file));
    }
  }

  const ids = [...structureContent.matchAll(/\bid=["']([^"']+)["']/gi)].map(
    (match) => match[1],
  );
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) {
    errors.push(
      issue('error', 'duplicate-id', `Duplicate HTML id values: ${duplicates.join(', ')}`, file),
    );
  }

  const sourceReferences = localReferences(structureContent, 'src');
  const hrefReferences = localReferences(structureContent, 'href');
  const styleReferences = hrefReferences.filter((reference) => /\.css$/i.test(reference));
  const linkReferences = hrefReferences.filter((reference) => !styleReferences.includes(reference));
  const [localSources, localStyles, localLinks] = await Promise.all([
    validateLocalReferences(sourceReferences, referenceContext, file),
    validateLocalReferences(styleReferences, referenceContext, file),
    validateLocalReferences(linkReferences, referenceContext, file, { allowDirectories: true }),
  ]);
  errors.push(...localSources.errors, ...localStyles.errors, ...localLinks.errors);

  let cssContent = '';
  let hasPrintCss = /@media\s+print/i.test(structureContent);
  for (const reference of styleReferences) {
    const record = localStyles.records.get(reference);
    if (record?.status !== 'file') continue;
    if (!localTextAssetWithinLimit(record, file, errors)) continue;
    let css;
    try {
      css = await readFile(record.path, 'utf8');
    } catch (error) {
      errors.push(
        issue(
          'error',
          'invalid-asset',
          `Could not read local stylesheet ${reference}: ${error.message}`,
          file,
        ),
      );
      continue;
    }
    cssContent += `\n${css}`;
    if (/@media\s+print/i.test(css)) hasPrintCss = true;
    warnings.push(...findPlaceholderIssues(css, record.path));
  }
  if (!hasPrintCss) {
    warnings.push(issue('warning', 'print-css', 'No print stylesheet found for PDF export.', file));
  }
  if (!/prefers-reduced-motion/i.test(`${structureContent}\n${cssContent}`)) {
    warnings.push(
      issue('warning', 'reduced-motion', 'No prefers-reduced-motion handling found.', file),
    );
  }

  const scriptReferences = sourceReferences.filter((reference) =>
    /\.(?:m?js|cjs)$/i.test(reference),
  );
  let scriptContent = '';
  for (const reference of scriptReferences) {
    const record = localSources.records.get(reference);
    if (record?.status !== 'file') continue;
    if (!localTextAssetWithinLimit(record, file, errors)) continue;
    let script;
    try {
      script = await readFile(record.path, 'utf8');
    } catch (error) {
      errors.push(
        issue(
          'error',
          'invalid-asset',
          `Could not read local script ${reference}: ${error.message}`,
          file,
        ),
      );
      continue;
    }
    scriptContent += `\n${script}`;
    warnings.push(...findPlaceholderIssues(script, record.path));
  }

  const scriptStructureContent = stripJavaScriptComments(scriptContent);

  if (!/addEventListener\(\s*["']keydown["']/i.test(scriptStructureContent)) {
    warnings.push(
      issue('warning', 'keyboard-navigation', 'No keyboard navigation handler found.', file),
    );
  } else if (
    !/ArrowRight|PageDown/.test(scriptStructureContent) ||
    !/ArrowLeft|PageUp/.test(scriptStructureContent)
  ) {
    warnings.push(
      issue(
        'warning',
        'keyboard-navigation',
        'Keyboard handler does not include both next and previous navigation keys.',
        file,
      ),
    );
  }

  if (
    !/(?:location|window\.location)\.hash|history\.(?:replaceState|pushState)/.test(
      scriptStructureContent,
    )
  ) {
    warnings.push(issue('warning', 'hash-navigation', 'No URL hash or history state found.', file));
  }

  if (!/innerWidth/.test(scriptStructureContent) || !/innerHeight/.test(scriptStructureContent)) {
    warnings.push(
      issue('warning', 'viewport-scaling', 'No viewport-based slide scaling found.', file),
    );
  }

  if (
    /width:\s*1920px/i.test(cssContent) &&
    /scale\(var\(--deck-scale\)\)/i.test(cssContent) &&
    !/translate\(\s*-50%\s*,\s*-50%\s*\)/i.test(cssContent)
  ) {
    warnings.push(
      issue(
        'warning',
        'canvas-centering',
        'Scaled 1920 × 1080 canvas may clip because it is not centered with translate(-50%, -50%).',
        file,
      ),
    );
  }

  const notesCount = slideSections.filter((section) => /class=["'][^"']*\bnotes\b/i.test(section))
    .length;
  if (slideSections.length > 0 && notesCount === 0) {
    warnings.push(issue('warning', 'speaker-notes', 'No speaker notes found.', file));
  }

  return {
    format: 'html',
    file,
    errors,
    warnings,
    metrics: {
      slides: slideSections.length,
      notes: notesCount,
      layouts: markedLayoutCount,
      uniqueLayouts: new Set(layoutSequence.filter(Boolean)).size,
      geometries: resolvedGeometrySequence.length,
      uniqueGeometries: new Set(resolvedGeometrySequence).size,
    },
  };
}

function splitMarpSlides(content, frontmatterEnd) {
  const lines = content.slice(frontmatterEnd).split(/\r?\n/);
  const slides = [];
  let current = [];
  let fence;

  for (const line of lines) {
    if (fence) {
      const closing = line.match(/^\s{0,3}(`+|~+)\s*$/);
      if (
        closing &&
        closing[1][0] === fence.character &&
        closing[1].length >= fence.length
      ) {
        fence = undefined;
      }
      current.push(line);
      continue;
    }

    const opening = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (opening) {
      fence = { character: opening[1][0], length: opening[1].length };
      current.push(line);
      continue;
    }

    if (/^---\s*$/.test(line)) {
      slides.push(current.join('\n'));
      current = [];
      continue;
    }
    current.push(line);
  }
  slides.push(current.join('\n'));
  return slides.filter((slide) => slide.trim().length > 0);
}

function countMarpHeadings(slide) {
  let count = 0;
  let fence;

  for (const line of slide.split(/\r?\n/)) {
    if (fence) {
      const closing = line.match(/^\s{0,3}(`+|~+)\s*$/);
      if (
        closing &&
        closing[1][0] === fence.character &&
        closing[1].length >= fence.length
      ) {
        fence = undefined;
      }
      continue;
    }

    const opening = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (opening) {
      fence = { character: opening[1][0], length: opening[1].length };
      continue;
    }

    if (/^\s{0,3}#{1,3}[\t ]+\S/.test(line)) count += 1;
  }

  return count;
}

async function inspectMarp(file) {
  const content = await readFile(file, 'utf8');
  const base = path.dirname(file);
  const referenceContext = await localReferenceContext(base);
  const errors = [];
  const warnings = [...findPlaceholderIssues(content, file)];
  const frontmatter = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);

  if (!frontmatter) {
    errors.push(issue('error', 'frontmatter', 'Missing YAML frontmatter.', file));
    return { format: 'marp', file, errors, warnings, metrics: { slides: 0 } };
  }

  const yaml = frontmatter[1];
  if (!/^marp:\s*true\s*$/im.test(yaml)) {
    errors.push(issue('error', 'marp-enabled', 'Frontmatter must include marp: true.', file));
  }
  if (!/^size:\s*16:9\s*$/im.test(yaml)) {
    warnings.push(issue('warning', 'aspect-ratio', 'Frontmatter should include size: 16:9.', file));
  }
  if (!/^theme:\s*\S+/im.test(yaml)) {
    warnings.push(issue('warning', 'theme', 'Frontmatter does not select a theme.', file));
  }

  const slideBodies = splitMarpSlides(content, frontmatter[0].length);
  const slides = slideBodies.length;
  const headingCounts = slideBodies.map(countMarpHeadings);
  const headings = headingCounts.reduce((count, slideHeadings) => count + slideHeadings, 0);
  if (slides === 0) errors.push(issue('error', 'slides', 'No slides found.', file));
  headingCounts.forEach((slideHeadings, index) => {
    if (slideHeadings > 0) return;
    warnings.push(
      issue('warning', 'headings', `Slide ${index + 1} may be missing a heading.`, file, {
        slide: index + 1,
      }),
    );
  });

  const layoutSequence = slideBodies.map(
    (slide) => slide.match(/<!--\s*_class:\s*([a-z0-9-]+)\s*-->/i)?.[1],
  );
  const markedLayoutCount = layoutSequence.filter(Boolean).length;
  if (slides && markedLayoutCount !== slides) {
    warnings.push(
      issue(
        'warning',
        'layout-marker',
        `${slides - markedLayoutCount} Marp slide(s) are missing semantic _class markers.`,
        file,
      ),
    );
  }
  const geometrySequence = layoutSequence.map((name) => layoutByName.get(name)?.geometry);
  warnings.push(...layoutDiversityIssues(layoutSequence, geometrySequence, file, slides));

  if (/!\[\]\(/.test(content)) {
    warnings.push(issue('warning', 'alt-text', 'One or more Markdown images have empty alt text.', file));
  }

  const imageReferences = [];
  for (const match of content.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    const reference = localReference(match[1]);
    if (reference) imageReferences.push(reference);
  }
  const localImages = await validateLocalReferences(imageReferences, referenceContext, file);
  errors.push(...localImages.errors);

  const themeMatch = yaml.match(/^theme:\s*([^\s#]+)\s*$/im);
  if (themeMatch && themeMatch[1] !== 'default') {
    const themeRecord = await inspectLocalReference('theme.css', referenceContext);
    if (themeRecord.status === 'missing') {
      warnings.push(
        issue('warning', 'theme-file', 'Custom theme selected but theme.css was not found.', file),
      );
    } else if (themeRecord.status !== 'file') {
      errors.push(localReferenceError(themeRecord, file));
    } else if (localTextAssetWithinLimit(themeRecord, file, errors)) {
      let css;
      try {
        css = await readFile(themeRecord.path, 'utf8');
      } catch (error) {
        errors.push(
          issue(
            'error',
            'invalid-asset',
            `Could not read local stylesheet theme.css: ${error.message}`,
            file,
          ),
        );
      }
      if (css !== undefined) warnings.push(...findPlaceholderIssues(css, themeRecord.path));
      if (css !== undefined && !/@theme\s+/i.test(css)) {
        warnings.push(
          issue(
            'warning',
            'marp-theme',
            'theme.css has no /* @theme ... */ declaration.',
            themeRecord.path,
          ),
        );
      }
    }
  }

  return {
    format: 'marp',
    file,
    errors,
    warnings,
    metrics: {
      slides,
      headings,
      layouts: markedLayoutCount,
      uniqueLayouts: new Set(layoutSequence.filter(Boolean)).size,
      geometries: geometrySequence.filter(Boolean).length,
      uniqueGeometries: new Set(geometrySequence.filter(Boolean)).size,
    },
  };
}

function pptxNamedSequence(content, name) {
  const block = content.match(
    new RegExp(`const\\s+${name}\\s*=\\s*Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`),
  );
  if (!block) return [];
  return [...block[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
}

async function inspectPptx(file) {
  const content = await readFile(file, 'utf8');
  const structureContent = stripJavaScriptComments(content);
  const base = path.dirname(file);
  const errors = [];
  const warnings = [...findPlaceholderIssues(content, file)];
  const slides = structureContent.match(/\.addSlide\s*\(/g)?.length || 0;
  const layoutSequence = pptxNamedSequence(structureContent, 'LAYOUT_SEQUENCE');
  const declaredGeometrySequence = pptxNamedSequence(structureContent, 'GEOMETRY_SEQUENCE');
  const geometrySequence = layoutSequence.map(
    (name, index) => declaredGeometrySequence[index] || layoutByName.get(name)?.geometry,
  );

  const syntax = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (syntax.status !== 0) {
    errors.push(
      issue(
        'error',
        'syntax',
        (syntax.stderr || syntax.stdout || 'PPTX source has invalid JavaScript syntax.').trim(),
        file,
      ),
    );
  }

  if (!/from\s+["']pptxgenjs["']|require\(["']pptxgenjs["']\)/.test(structureContent)) {
    errors.push(issue('error', 'pptxgenjs', 'PptxGenJS import not found.', file));
  }
  if (!/LAYOUT_WIDE/.test(structureContent)) {
    errors.push(issue('error', 'aspect-ratio', 'PPTX source must use LAYOUT_WIDE.', file));
  }
  if (!/\.writeFile\s*\(/.test(structureContent)) {
    errors.push(issue('error', 'write-file', 'No writeFile call found.', file));
  }
  if (slides === 0) errors.push(issue('error', 'slides', 'No addSlide calls found.', file));
  if (!/\.addNotes\s*\(/.test(structureContent)) {
    warnings.push(issue('warning', 'speaker-notes', 'No PptxGenJS speaker notes found.', file));
  }
  if (/addShape\(\s*["']oval["']/.test(structureContent)) {
    warnings.push(
      issue(
        'warning',
        'shape-api',
        'Use pptx.ShapeType values instead of literal shape names for portability.',
        file,
      ),
    );
  }

  if (!layoutSequence.length) {
    warnings.push(
      issue('warning', 'layout-marker', 'No explicit PPTX LAYOUT_SEQUENCE found.', file),
    );
  } else if (layoutSequence.length !== slides) {
    warnings.push(
      issue(
        'warning',
        'layout-marker',
        `PPTX LAYOUT_SEQUENCE has ${layoutSequence.length} entries for ${slides} slide(s).`,
        file,
      ),
    );
  }
  if (declaredGeometrySequence.length && declaredGeometrySequence.length !== slides) {
    warnings.push(
      issue(
        'warning',
        'geometry-marker',
        `PPTX GEOMETRY_SEQUENCE has ${declaredGeometrySequence.length} entries for ${slides} slide(s); missing entries use catalog geometry.`,
        file,
      ),
    );
  }
  warnings.push(...layoutDiversityIssues(layoutSequence, geometrySequence, file, slides));

  const packagePath = path.join(base, 'package.json');
  if (!existsSync(packagePath)) {
    warnings.push(issue('warning', 'package-json', 'No package.json found next to PPTX source.', file));
  } else {
    try {
      const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
      const version = packageJson.dependencies?.pptxgenjs || packageJson.devDependencies?.pptxgenjs;
      if (!version) {
        errors.push(
          issue('error', 'dependency', 'package.json does not declare pptxgenjs.', packagePath),
        );
      }
    } catch (error) {
      errors.push(issue('error', 'package-json', `Invalid package.json: ${error.message}`, packagePath));
    }
  }

  return {
    format: 'pptx',
    file,
    errors,
    warnings,
    metrics: {
      slides,
      layouts: layoutSequence.length,
      uniqueLayouts: new Set(layoutSequence).size,
      geometries: geometrySequence.filter(Boolean).length,
      uniqueGeometries: new Set(geometrySequence.filter(Boolean)).size,
    },
  };
}

function deckFormatForFile(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.html' || extension === '.htm') return 'html';
  if (extension === '.md' || extension === '.mdx') return 'marp';
  if (['.js', '.mjs', '.cjs'].includes(extension)) return 'pptx';
  return undefined;
}

function selectSingleCandidate(candidates, directory, format) {
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    throw new CliError(
      `Ambiguous ${format ? `${format} ` : ''}deck entries in ${directory}: ${candidates
        .map((candidate) => path.basename(candidate.file))
        .join(', ')}. Select one entry or remove the extras.`,
    );
  }
  const formatLabel = format ? `${format} ` : '';
  throw new CliError(`No ${formatLabel}deck entry found in ${directory}.`);
}

async function locateDeck(target, requestedFormat) {
  const resolved = path.resolve(target);
  if (!existsSync(resolved)) throw new CliError(`Deck path does not exist: ${resolved}`);
  const info = await stat(resolved);

  if (info.isFile()) {
    const inferredFormat = deckFormatForFile(resolved);
    if (!inferredFormat) throw new CliError(`Unsupported deck file: ${resolved}`);
    if (requestedFormat && requestedFormat !== inferredFormat) {
      throw new CliError(
        `Deck file ${resolved} is ${inferredFormat}, which conflicts with requested format ${requestedFormat}.`,
      );
    }
    return { format: inferredFormat, file: resolved };
  }

  const candidates = [
    { format: 'html', file: path.join(resolved, 'index.html') },
    { format: 'marp', file: path.join(resolved, 'deck.md') },
    { format: 'pptx', file: path.join(resolved, 'deck.mjs') },
    { format: 'pptx', file: path.join(resolved, 'deck.js') },
    { format: 'pptx', file: path.join(resolved, 'deck.cjs') },
  ].filter((candidate) => existsSync(candidate.file));

  const metadataPath = path.join(resolved, 'template.json');
  let metadataFormat;
  if (existsSync(metadataPath)) {
    let metadata;
    try {
      metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    } catch (error) {
      throw new CliError(`Invalid template.json in ${resolved}: ${error.message}`);
    }
    metadataFormat = metadata.format;
    if (!supportedFormats.has(metadataFormat)) {
      throw new CliError(
        `template.json in ${resolved} must declare format as html, marp, or pptx.`,
      );
    }
    if (requestedFormat && requestedFormat !== metadataFormat) {
      throw new CliError(
        `template.json declares ${metadataFormat}, which conflicts with requested format ${requestedFormat}.`,
      );
    }
  }

  const selectedFormat = requestedFormat || metadataFormat;
  if (selectedFormat) {
    return selectSingleCandidate(
      candidates.filter((candidate) => candidate.format === selectedFormat),
      resolved,
      selectedFormat,
    );
  }

  if (!candidates.length) {
    throw new CliError(
      `No supported deck entry found in ${resolved}. Expected index.html, deck.md, deck.mjs, deck.js, or deck.cjs.`,
    );
  }
  return selectSingleCandidate(candidates, resolved);
}

export async function checkDeck(target, { strict = false, format } = {}) {
  if (format !== undefined && !supportedFormats.has(format)) {
    throw new CliError(`Unsupported format "${format}". Use html, marp, or pptx.`);
  }
  const located = await locateDeck(target, format);
  const result =
    located.format === 'html'
      ? await inspectHtml(located.file)
      : located.format === 'marp'
        ? await inspectMarp(located.file)
        : await inspectPptx(located.file);

  return {
    ok: result.errors.length === 0 && (!strict || result.warnings.length === 0),
    strict,
    target: path.resolve(target),
    ...result,
  };
}
