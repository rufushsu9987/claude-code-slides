#!/usr/bin/env node

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkDeck, initDeck } from '../lib/cli.mjs';

const workspace = await mkdtemp(path.join(os.tmpdir(), 'codex-slides-smoke-'));

try {
  for (const format of ['html', 'marp', 'pptx']) {
    const target = path.join(workspace, format);
    await initDeck({ title: `Smoke Test ${format}`, format, destination: target, cwd: '/' });
    const result = await checkDeck(target);
    if (!result.ok) {
      throw new Error(`${format} template failed validation: ${JSON.stringify(result.errors)}`);
    }

    const entry =
      format === 'html'
        ? path.join(target, 'index.html')
        : format === 'marp'
          ? path.join(target, 'deck.md')
          : path.join(target, 'deck.mjs');
    const content = await readFile(entry, 'utf8');
    if (/\{\{[A-Z0-9_]+\}\}/.test(content)) {
      throw new Error(`${format} template contains an unresolved token`);
    }
  }

  console.log('Scaffolded and validated HTML, Marp, and PPTX templates.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
