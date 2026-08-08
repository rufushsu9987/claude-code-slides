import path from 'node:path';

const FORMAT_PATTERNS = [
  ['HTML', /\bhtml?\b/i],
  ['Marp', /\bmarp\b/i],
  ['PPTX', /\bpptx\b|powerpoint/i],
];

const SECRET_PATTERNS = [
  /\b(?:sk|rk|xai|hf)[-_][A-Za-z0-9_-]{8,}\b/g,
  /\b(?:api[_-]?key|token|secret|password|authorization)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
  /--(?:api[_-]?key|token|secret|password|authorization)\s+(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^@\s]+@/gi,
];

const INTAKE_FILE_PATTERNS = [
  /^README(?:\.[a-z]{2}(?:-[A-Z]{2})?)?\.md$/i,
  /^CHANGELOG(?:\.[a-z]{2}(?:-[A-Z]{2})?)?\.md$/i,
  /^LICENSE(?:\.[A-Za-z0-9._-]+)?$/i,
  /^(?:package|plugin|pyproject|Cargo|go|composer|Gemfile|Dockerfile)(?:\.[A-Za-z0-9._-]+)?$/i,
  /^(?:package-lock|pnpm-lock|yarn\.lock)\.ya?ml?$/i,
];

export function normalizeRelativePath(value) {
  return String(value).replaceAll('\\', '/').replace(/^\.\//, '');
}

export function selectIntakeFiles(relativePaths) {
  return [...new Set(relativePaths.map(normalizeRelativePath))]
    .filter((relativePath) => {
      const basename = path.posix.basename(relativePath);
      return (
        INTAKE_FILE_PATTERNS.some((pattern) => pattern.test(basename)) ||
        (/^docs\//i.test(relativePath) && /\.md$/i.test(relativePath)) ||
        (/^\.claude-plugin\//.test(relativePath) && /\.json$/i.test(relativePath)) ||
        (/^\.codex-plugin\//.test(relativePath) && /\.json$/i.test(relativePath))
      );
    })
    .sort((left, right) => left.localeCompare(right));
}

export function redactSecrets(value) {
  let result = String(value);
  result = result.replace(
    SECRET_PATTERNS[1],
    (match) => match.replace(/([:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)$/, '$1[REDACTED]'),
  );
  result = result.replace(
    SECRET_PATTERNS[2],
    (match) => match.replace(/\s+(?:"[^"]*"|'[^']*'|[^\s,;]+)$/, ' [REDACTED]'),
  );
  result = result.replace(SECRET_PATTERNS[3], (match) => match.replace(/:\/\/[^@]+@/, '://[REDACTED]@'));
  result = result.replace(SECRET_PATTERNS[0], '[REDACTED]');
  return result;
}

export function scanForSecrets(value) {
  const source = String(value);
  const matches = [];
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) matches.push(match[0]);
  }
  return [...new Set(matches)];
}

export function extractFormats(text) {
  return FORMAT_PATTERNS.filter(([, pattern]) => pattern.test(String(text))).map(([name]) => name);
}

export function extractCommands(text) {
  const commands = [];
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('```')) continue;
    if (/^(?:\/|\$|codex\s|claude\s|npm\s|npx\s|node\s)/.test(line)) {
      commands.push(line);
    }
  }
  return [...new Set(commands)];
}

function cleanSceneText(value) {
  return String(value)
    .replace(/^```[\w-]*\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

export function parseScenes(markdown) {
  const source = String(markdown).replace(/\r\n/g, '\n').trim();
  const headings = [...source.matchAll(/^##\s+(Scene\s+\d+[^\n]*)\n/gim)];

  if (headings.length > 0) {
    return headings
      .map((match, index) => {
        const start = match.index + match[0].length;
        const end = headings[index + 1]?.index ?? source.length;
        const title = match[1].trim();
        const explicitIndex = Number(title.match(/\d+/)?.[0] || index + 1);
        return {
          index: explicitIndex,
          title,
          text: cleanSceneText(source.slice(start, end)),
        };
      })
      .filter((scene) => scene.text.length > 0);
  }

  return source
    .split(/\n\s*\n/)
    .map((text) => cleanSceneText(text.replace(/^#.*\n/, '')))
    .filter(Boolean)
    .map((text, index) => ({ index: index + 1, title: `Scene ${index + 1}`, text }));
}

export function estimateSceneDuration(text, { charsPerSecond = 4, minimumSeconds = 2 } = {}) {
  const characters = String(text).replace(/\s/g, '').length;
  return Math.max(minimumSeconds, Number((characters / charsPerSecond).toFixed(3)));
}

export function buildTimings(scenes, options = {}) {
  let cursor = 0;
  const timingScenes = scenes.map((scene) => {
    const duration = Number(
      scene.duration ?? estimateSceneDuration(scene.text, options),
    );
    const start = Number(cursor.toFixed(3));
    const end = Number((cursor + duration).toFixed(3));
    cursor = end;
    return {
      index: scene.index,
      title: scene.title,
      text: scene.text,
      start,
      end,
      duration: Number((end - start).toFixed(3)),
      timingConfidence: scene.duration ? 'measured' : 'estimated',
    };
  });

  const confidence = timingScenes.some((scene) => scene.timingConfidence === 'estimated')
    ? 'estimated'
    : 'measured';

  return {
    schemaVersion: 1,
    timingConfidence: confidence,
    duration: Number(cursor.toFixed(3)),
    scenes: timingScenes,
  };
}

export function validateTimings(timings, expectedSceneCount) {
  const errors = [];
  const scenes = Array.isArray(timings?.scenes) ? timings.scenes : [];
  if (expectedSceneCount !== undefined && scenes.length !== expectedSceneCount) {
    errors.push(`Expected ${expectedSceneCount} scenes, found ${scenes.length}.`);
  }
  if (scenes.length === 0) errors.push('At least one scene is required.');

  let cursor = 0;
  for (const [position, scene] of scenes.entries()) {
    if (Math.abs(Number(scene.start) - cursor) > 0.001) {
      errors.push(`Scene ${position + 1} does not start at the previous scene end.`);
    }
    if (!(Number(scene.end) > Number(scene.start))) {
      errors.push(`Scene ${position + 1} must have a positive duration.`);
    }
    cursor = Number(scene.end);
  }

  if (timings?.duration !== undefined && Math.abs(Number(timings.duration) - cursor) > 0.001) {
    errors.push('Timing duration does not match the final scene end.');
  }

  return { ok: errors.length === 0, errors };
}

export function formatSrtTimestamp(seconds) {
  const milliseconds = Math.max(0, Math.round(Number(seconds) * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const remaining = milliseconds % 60_000;
  const wholeSeconds = Math.floor(remaining / 1000);
  const millis = remaining % 1000;
  return [hours, minutes, wholeSeconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':') + `,${String(millis).padStart(3, '0')}`;
}

export function buildSrt(timings) {
  return timings.scenes
    .map(
      (scene, index) =>
        `${index + 1}\n${formatSrtTimestamp(scene.start)} --> ${formatSrtTimestamp(scene.end)}\n${scene.text}\n`,
    )
    .join('\n');
}

export function buildStoryBrief(facts) {
  const identity = facts.identity || {};
  const capabilities = facts.capabilities || {};
  const evidence = facts.evidence || [];
  const warnings = facts.warnings || [];
  const formatLines = (capabilities.formats || []).map((format) => `- ${format}`).join('\n') || '- None found';
  const commandLines = (capabilities.commands || []).map((command) => `- \`${command}\``).join('\n') || '- None found';
  const evidenceLines = evidence.map((item) => `- ${item.field}: ${item.value} (${item.source})`).join('\n') || '- None recorded';
  const warningLines = warnings.map((warning) => `- ${warning}`).join('\n') || '- None';

  return `# Project promotion brief

## Verified facts

- Name: ${identity.name || 'Unknown'}
- Version: ${identity.version || 'Unknown'}
- Description: ${identity.description || 'Unknown'}
- License: ${identity.license || 'Unknown'}

### Supported formats

${formatLines}

### Documented commands

${commandLines}

### Evidence

${evidenceLines}

## Needs review before publishing

${warningLines}

## Editorial guardrail

Use only the verified facts above for public claims. Keep unsupported assumptions, generated metrics, and provider credentials out of the deck, narration, QA report, and social copy.
`;
}

export function classifyArtifacts(paths) {
  return paths.map((rawPath) => {
    const normalized = normalizeRelativePath(rawPath);
    const basename = path.posix.basename(normalized).toLowerCase();
    const extension = path.posix.extname(normalized).toLowerCase();
    let kind = 'other';

    if (basename === 'video_qa.md' || basename === 'video-qa.json' || basename === 'video_qa.json') kind = 'qa-report';
    else if (extension === '.html') kind = 'html';
    else if (extension === '.pptx') kind = 'pptx';
    else if (extension === '.mp4' || extension === '.webm' || extension === '.mov') kind = 'video';
    else if (extension === '.mp3' || extension === '.wav' || extension === '.m4a') kind = 'audio';
    else if (extension === '.srt' || extension === '.vtt') kind = 'subtitle';
    else if (extension === '.png' || extension === '.jpg' || extension === '.jpeg' || extension === '.webp') kind = 'image';
    else if (extension === '.json' || extension === '.md' || extension === '.txt') kind = 'documentation';
    else if (extension === '.mjs' || extension === '.js' || extension === '.css') kind = 'source';

    return { path: normalized, kind };
  });
}

export function splitThreadsPosts(text, maxChars = 500) {
  const paragraphs = String(text)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const contentBudget = maxChars - 8;
  if (contentBudget <= 0) throw new Error('A paragraph exceeds the maximum Threads post length.');
  if (paragraphs.some((paragraph) => paragraph.length > contentBudget)) {
    throw new Error('A paragraph exceeds the maximum Threads post length.');
  }

  const chunks = [];
  let current = '';
  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (current && candidate.length > contentBudget) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks.map((chunk, index) => {
    const label = `${index + 1}/${chunks.length}`;
    const post = `${label}\n${chunk}`;
    if (post.length > maxChars) throw new Error('A generated Threads post exceeds the maximum.');
    return post;
  });
}

export function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

export function formatFfconcatPath(value) {
  return `file ${shellQuote(path.resolve(String(value)))}`;
}
