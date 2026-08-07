#!/usr/bin/env node

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkDeck, initDeck, listTemplates } from '../lib/cli.mjs';

const workspace = await mkdtemp(path.join(os.tmpdir(), 'code-slides-smoke-'));

try {
  const catalog = await listTemplates();

  for (const template of catalog.templates) {
    for (const format of template.formats) {
      const target = path.join(workspace, template.name, format);
      const created = await initDeck({
        title: `Smoke Test ${template.displayName} ${format}`,
        format,
        template: template.name,
        destination: target,
        cwd: '/',
      });

      if (created.template !== template.name) {
        throw new Error(`Expected ${template.name}, received ${created.template}`);
      }

      const result = await checkDeck(target);
      if (!result.ok) {
        throw new Error(
          `${template.name}/${format} failed validation: ${JSON.stringify(result.errors)}`,
        );
      }

      const metadata = JSON.parse(await readFile(path.join(target, 'template.json'), 'utf8'));
      if (metadata.name !== template.name || metadata.format !== format) {
        throw new Error(`${template.name}/${format} wrote invalid template metadata`);
      }

      const entry =
        format === 'html'
          ? path.join(target, 'index.html')
          : format === 'marp'
            ? path.join(target, 'deck.md')
            : path.join(target, 'deck.mjs');
      const content = await readFile(entry, 'utf8');
      if (/\{\{[A-Z0-9_]+\}\}/.test(content)) {
        throw new Error(`${template.name}/${format} contains an unresolved token`);
      }

      if (format === 'html' || format === 'marp') {
        const css = await readFile(path.join(target, 'theme.css'), 'utf8');
        if (!css.includes(`template-preset: ${template.name}`)) {
          throw new Error(`${template.name}/${format} did not apply its CSS preset`);
        }
      }
    }
  }

  console.log(
    `Scaffolded and validated ${catalog.templates.length} templates across HTML, Marp, and PPTX.`,
  );
} finally {
  await rm(workspace, { recursive: true, force: true });
}
