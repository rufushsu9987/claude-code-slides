import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { CliError } from './runtime.mjs';

const layoutFamilies = new Map(
  Object.entries({
    'editorial-cover': 'opening',
    'hero-statement': 'statement',
    'asymmetric-editorial': 'statement',
    'split-narrative': 'explanation',
    'metric-spotlight': 'evidence',
    'evidence-claim': 'evidence',
    'layered-architecture': 'system',
    'flow-architecture': 'system',
    'before-after': 'comparison',
    'comparison-matrix': 'comparison',
    timeline: 'sequence',
    'process-steps': 'sequence',
    'code-walkthrough': 'demonstration',
    'risk-matrix': 'risk',
    decision: 'decision',
    'closing-manifesto': 'closing',
  }),
);

const cardBasedLayouts = new Set(['flow-architecture', 'process-steps', 'risk-matrix']);

function issue(level, code, message, file, details = {}) {
  return { level, code, message, file, ...details };
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

function layoutDiversityIssues(sequence, file) {
  const warnings = [];
  if (!sequence.length) return warnings;

  const unknown = [...new Set(sequence.filter((name) => !layoutFamilies.has(name)))];
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

  const repeats = [];
  for (let index = 1; index < sequence.length; index += 1) {
    if (sequence[index] === sequence[index - 1]) {
      repeats.push(`${index}→${index + 1} (${sequence[index]})`);
    }
  }
  if (repeats.length) {
    warnings.push(
      issue(
        'warning',
        'layout-repeat',
        `Consecutive layout repeats found at slides ${repeats.join(', ')}.`,
        file,
      ),
    );
  }

  if (sequence.length >= 10) {
    const unique = new Set(sequence).size;
    if (unique < 8) {
      warnings.push(
        issue(
          'warning',
          'layout-diversity',
          `Deck uses ${unique} unique layout archetype(s) across ${sequence.length} slides; target at least 8.`,
          file,
        ),
      );
    }
  }

  const cardCount = sequence.filter((name) => cardBasedLayouts.has(name)).length;
  if (sequence.length >= 5 && cardCount / sequence.length > 0.2) {
    warnings.push(
      issue(
        'warning',
        'layout-card-share',
        `Card-based layouts occupy ${cardCount}/${sequence.length} slides; keep them near or below 20%.`,
        file,
      ),
    );
  }

  for (let index = 0; index <= sequence.length - 3; index += 1) {
    const window = sequence.slice(index, index + 3);
    const families = window.map((name) => layoutFamilies.get(name)).filter(Boolean);
    if (families.length === 3 && new Set(families).size === 1) {
      warnings.push(
        issue(
          'warning',
          'layout-family-rhythm',
          `Slides ${index + 1}–${index + 3} all use the ${families[0]} layout family.`,
          file,
        ),
      );
      break;
    }
  }

  for (let index = 0; index <= sequence.length - 4; index += 1) {
    const families = sequence
      .slice(index, index + 4)
      .map((name) => layoutFamilies.get(name))
      .filter(Boolean);
    if (families.length === 4 && new Set(families).size === 1) {
      warnings.push(
        issue(
          'warning',
          'layout-rhythm-change',
          `Slides ${index + 1}–${index + 4} have no layout-family rhythm change.`,
          file,
        ),
      );
      break;
    }
  }

  return warnings;
}

function localReferences(content, attribute) {
  const references = [];
  const regex = new RegExp(`${attribute}=["']([^"']+)["']`, 'gi');
  for (const match of content.matchAll(regex)) {
    const value = match[1].trim();
    if (
      !value ||
      value.startsWith('#') ||
      value.startsWith('data:') ||
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('mailto:') ||
      value.startsWith('javascript:')
    ) {
      continue;
    }
    references.push(value.split(/[?#]/, 1)[0]);
  }
  return references;
}

async function missingLocalReferences(references, baseDirectory) {
  const missing = [];
  for (const reference of references) {
    const resolved = path.resolve(baseDirectory, reference);
    try {
      await access(resolved);
    } catch {
      missing.push(reference);
    }
  }
  return [...new Set(missing)];
}

async function inspectHtml(file) {
  const content = await readFile(file, 'utf8');
  const base = path.dirname(file);
  const errors = [];
  const warnings = [...findPlaceholderIssues(content, file)];
  const sections = content.match(/<section\b[\s\S]*?<\/section>/gi) || [];
  const slideSections = sections.filter((section) => /class=["'][^"']*\bslide\b/i.test(section));

  if (!/<meta\s+name=["']viewport["']/i.test(content)) {
    warnings.push(issue('warning', 'viewport', 'Missing viewport meta tag.', file));
  }
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(content)) {
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

  const layoutSequence = slideSections
    .map((section) => section.match(/\bdata-layout=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);
  if (slideSections.length && layoutSequence.length !== slideSections.length) {
    warnings.push(
      issue(
        'warning',
        'layout-marker',
        `${slideSections.length - layoutSequence.length} HTML slide(s) are missing data-layout markers.`,
        file,
      ),
    );
  }
  warnings.push(...layoutDiversityIssues(layoutSequence, file));

  for (const image of content.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=["'][^"']+["']/i.test(image[0])) {
      warnings.push(issue('warning', 'alt-text', 'Image is missing meaningful alt text.', file));
    }
  }

  const ids = [...content.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) {
    errors.push(
      issue('error', 'duplicate-id', `Duplicate HTML id values: ${duplicates.join(', ')}`, file),
    );
  }

  const references = [...localReferences(content, 'src'), ...localReferences(content, 'href')];
  const missing = await missingLocalReferences(references, base);
  for (const reference of missing) {
    errors.push(issue('error', 'missing-asset', `Missing local asset: ${reference}`, file));
  }

  const styleReferences = localReferences(content, 'href').filter((reference) =>
    reference.endsWith('.css'),
  );
  let cssContent = '';
  let hasPrintCss = /@media\s+print/i.test(content);
  for (const reference of styleReferences) {
    const cssPath = path.resolve(base, reference);
    if (!existsSync(cssPath)) continue;
    const css = await readFile(cssPath, 'utf8');
    cssContent += `\n${css}`;
    if (/@media\s+print/i.test(css)) hasPrintCss = true;
    warnings.push(...findPlaceholderIssues(css, cssPath));
  }
  if (!hasPrintCss) {
    warnings.push(issue('warning', 'print-css', 'No print stylesheet found for PDF export.', file));
  }
  if (!/prefers-reduced-motion/i.test(`${content}\n${cssContent}`)) {
    warnings.push(
      issue('warning', 'reduced-motion', 'No prefers-reduced-motion handling found.', file),
    );
  }

  const scriptReferences = localReferences(content, 'src').filter((reference) =>
    /\.(?:m?js|cjs)$/i.test(reference),
  );
  let scriptContent = '';
  for (const reference of scriptReferences) {
    const scriptPath = path.resolve(base, reference);
    if (!existsSync(scriptPath)) continue;
    const script = await readFile(scriptPath, 'utf8');
    scriptContent += `\n${script}`;
    warnings.push(...findPlaceholderIssues(script, scriptPath));
  }

  if (!/addEventListener\(\s*["']keydown["']/i.test(scriptContent)) {
    warnings.push(
      issue('warning', 'keyboard-navigation', 'No keyboard navigation handler found.', file),
    );
  } else if (!/ArrowRight|PageDown/.test(scriptContent) || !/ArrowLeft|PageUp/.test(scriptContent)) {
    warnings.push(
      issue(
        'warning',
        'keyboard-navigation',
        'Keyboard handler does not include both next and previous navigation keys.',
        file,
      ),
    );
  }

  if (!/(?:location|window\.location)\.hash|history\.(?:replaceState|pushState)/.test(scriptContent)) {
    warnings.push(issue('warning', 'hash-navigation', 'No URL hash or history state found.', file));
  }

  if (!/innerWidth/.test(scriptContent) || !/innerHeight/.test(scriptContent)) {
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
      layouts: layoutSequence.length,
      uniqueLayouts: new Set(layoutSequence).size,
    },
  };
}

function countMarpSlides(content, frontmatterEnd) {
  const lines = content.slice(frontmatterEnd).split(/\r?\n/);
  let inFence = false;
  let slides = 1;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && /^---\s*$/.test(line)) slides += 1;
  }
  return slides;
}

async function inspectMarp(file) {
  const content = await readFile(file, 'utf8');
  const base = path.dirname(file);
  const errors = [];
  const warnings = [...findPlaceholderIssues(content, file)];
  const frontmatter = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);

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

  const slides = countMarpSlides(content, frontmatter[0].length);
  const headings = content.match(/^#{1,3}\s+\S.+$/gm)?.length || 0;
  if (slides === 0) errors.push(issue('error', 'slides', 'No slides found.', file));
  if (headings < slides) {
    warnings.push(
      issue('warning', 'headings', `${slides - headings} slide(s) may be missing a heading.`, file),
    );
  }

  const layoutSequence = [...content.matchAll(/<!--\s*_class:\s*([a-z0-9-]+)\s*-->/gi)].map(
    (match) => match[1],
  );
  if (slides && layoutSequence.length !== slides) {
    warnings.push(
      issue(
        'warning',
        'layout-marker',
        `${slides - layoutSequence.length} Marp slide(s) are missing semantic _class markers.`,
        file,
      ),
    );
  }
  warnings.push(...layoutDiversityIssues(layoutSequence, file));

  if (/!\[\]\(/.test(content)) {
    warnings.push(issue('warning', 'alt-text', 'One or more Markdown images have empty alt text.', file));
  }

  const imageReferences = [];
  for (const match of content.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) {
    const reference = match[1];
    if (!/^https?:\/\//.test(reference) && !reference.startsWith('data:')) {
      imageReferences.push(reference);
    }
  }
  const missing = await missingLocalReferences(imageReferences, base);
  for (const reference of missing) {
    errors.push(issue('error', 'missing-asset', `Missing local asset: ${reference}`, file));
  }

  const themeMatch = yaml.match(/^theme:\s*([^\s#]+)\s*$/im);
  if (themeMatch && themeMatch[1] !== 'default') {
    const siblingTheme = path.join(base, 'theme.css');
    if (!existsSync(siblingTheme)) {
      warnings.push(
        issue('warning', 'theme-file', 'Custom theme selected but theme.css was not found.', file),
      );
    } else {
      const css = await readFile(siblingTheme, 'utf8');
      warnings.push(...findPlaceholderIssues(css, siblingTheme));
      if (!/@theme\s+/i.test(css)) {
        warnings.push(
          issue(
            'warning',
            'marp-theme',
            'theme.css has no /* @theme ... */ declaration.',
            siblingTheme,
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
      layouts: layoutSequence.length,
      uniqueLayouts: new Set(layoutSequence).size,
    },
  };
}

function pptxLayoutSequence(content) {
  const block = content.match(/const\s+LAYOUT_SEQUENCE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/);
  if (!block) return [];
  return [...block[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
}

async function inspectPptx(file) {
  const content = await readFile(file, 'utf8');
  const base = path.dirname(file);
  const errors = [];
  const warnings = [...findPlaceholderIssues(content, file)];
  const slides = content.match(/\.addSlide\s*\(/g)?.length || 0;
  const layoutSequence = pptxLayoutSequence(content);

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

  if (!/from\s+["']pptxgenjs["']|require\(["']pptxgenjs["']\)/.test(content)) {
    errors.push(issue('error', 'pptxgenjs', 'PptxGenJS import not found.', file));
  }
  if (!/LAYOUT_WIDE/.test(content)) {
    errors.push(issue('error', 'aspect-ratio', 'PPTX source must use LAYOUT_WIDE.', file));
  }
  if (!/\.writeFile\s*\(/.test(content)) {
    errors.push(issue('error', 'write-file', 'No writeFile call found.', file));
  }
  if (slides === 0) errors.push(issue('error', 'slides', 'No addSlide calls found.', file));
  if (!/\.addNotes\s*\(/.test(content)) {
    warnings.push(issue('warning', 'speaker-notes', 'No PptxGenJS speaker notes found.', file));
  }
  if (/addShape\(\s*["']oval["']/.test(content)) {
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
  warnings.push(...layoutDiversityIssues(layoutSequence, file));

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
    },
  };
}

async function locateDeck(target) {
  const resolved = path.resolve(target);
  if (!existsSync(resolved)) throw new CliError(`Deck path does not exist: ${resolved}`);
  const info = await stat(resolved);

  if (info.isFile()) {
    const extension = path.extname(resolved).toLowerCase();
    if (extension === '.html' || extension === '.htm') return { format: 'html', file: resolved };
    if (extension === '.md' || extension === '.mdx') return { format: 'marp', file: resolved };
    if (['.js', '.mjs', '.cjs', '.ts'].includes(extension)) return { format: 'pptx', file: resolved };
    throw new CliError(`Unsupported deck file: ${resolved}`);
  }

  const candidates = [
    { format: 'html', file: path.join(resolved, 'index.html') },
    { format: 'marp', file: path.join(resolved, 'deck.md') },
    { format: 'pptx', file: path.join(resolved, 'deck.mjs') },
    { format: 'pptx', file: path.join(resolved, 'deck.js') },
    { format: 'pptx', file: path.join(resolved, 'deck.ts') },
  ];
  const found = candidates.find((candidate) => existsSync(candidate.file));
  if (!found) {
    throw new CliError(
      `No supported deck entry found in ${resolved}. Expected index.html, deck.md, deck.mjs, deck.js, or deck.ts.`,
    );
  }
  return found;
}

export async function checkDeck(target) {
  const located = await locateDeck(target);
  const result =
    located.format === 'html'
      ? await inspectHtml(located.file)
      : located.format === 'marp'
        ? await inspectMarp(located.file)
        : await inspectPptx(located.file);

  return {
    ok: result.errors.length === 0,
    target: path.resolve(target),
    ...result,
  };
}
