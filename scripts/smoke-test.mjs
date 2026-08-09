#!/usr/bin/env node

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkDeck, initDeck, listLayouts, listTemplates } from '../lib/cli.mjs';

const workspace = await mkdtemp(path.join(os.tmpdir(), 'code-slides-smoke-'));
function assertDiverse(sequence, label) {
  if (sequence.length < 10) throw new Error(`${label} should demonstrate at least 10 layouts`);
  if (new Set(sequence).size < 8) throw new Error(`${label} should use at least 8 unique layouts`);
  for (let index = 1; index < sequence.length; index += 1) {
    if (sequence[index] === sequence[index - 1]) throw new Error(`${label} repeats ${sequence[index]} consecutively`);
  }
}

try {
  const [catalog, layoutCatalog] = await Promise.all([listTemplates(), listLayouts()]);
  if (catalog.default !== 'claude-editorial') throw new Error(`Expected claude-editorial default, received ${catalog.default}`);
  assertDiverse(layoutCatalog.starterSequence, 'layout catalog starter sequence');
  for (const template of catalog.templates) {
    for (const format of template.formats) {
      const target = path.join(workspace, template.name, format);
      const created = await initDeck({ title: `Smoke Test ${template.displayName} ${format}`, format, template: template.name, destination: target, cwd: '/' });
      if (created.template !== template.name) throw new Error(`Expected ${template.name}, received ${created.template}`);
      const result = await checkDeck(target);
      if (!result.ok) throw new Error(`${template.name}/${format} failed validation: ${JSON.stringify(result.errors)}`);
      const unexpectedLayoutWarnings = result.warnings.filter((finding) =>
        ['layout-archetype', 'layout-marker'].includes(finding.code),
      );
      if (unexpectedLayoutWarnings.length) {
        throw new Error(
          `${template.name}/${format} emitted unexpected layout warnings: ${JSON.stringify(unexpectedLayoutWarnings)}`,
        );
      }
      const metadata = JSON.parse(await readFile(path.join(target, 'template.json'), 'utf8'));
      if (metadata.name !== template.name || metadata.format !== format) throw new Error(`${template.name}/${format} wrote invalid template metadata`);
      if (metadata.layoutSystem?.name !== layoutCatalog.name) throw new Error(`${template.name}/${format} omitted layout-system metadata`);
      assertDiverse(metadata.layoutSystem.starterSequence, `${template.name}/${format} metadata layout sequence`);
      const entry = format === 'html' ? path.join(target, 'index.html') : format === 'marp' ? path.join(target, 'deck.md') : path.join(target, 'deck.mjs');
      const content = await readFile(entry, 'utf8');
      if (/\{\{[A-Z0-9_]+\}\}/.test(content)) throw new Error(`${template.name}/${format} contains an unresolved token`);
      let sequence;
      if (format === 'html') sequence = [...content.matchAll(/data-layout="([^"]+)"/g)].map((match) => match[1]);
      else if (format === 'marp') sequence = [...content.matchAll(/<!-- _class: ([a-z0-9-]+) -->/g)].map((match) => match[1]);
      else {
        const block = content.match(/const LAYOUT_SEQUENCE = Object\.freeze\(\[([\s\S]*?)\]\);/);
        if (!block) throw new Error(`${template.name}/${format} has no LAYOUT_SEQUENCE`);
        sequence = [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
      }
      assertDiverse(sequence, `${template.name}/${format}`);
      if (format === 'html' || format === 'marp') {
        const css = await readFile(path.join(target, 'theme.css'), 'utf8');
        if (!css.includes(`template-preset: ${template.name}`)) throw new Error(`${template.name}/${format} did not apply its CSS preset`);
      }
    }
  }
  const aliasTarget = path.join(workspace, 'legacy-alias');
  const alias = await initDeck({ title: 'Legacy alias smoke test', format: 'html', template: 'terminal-editorial', destination: aliasTarget, cwd: '/' });
  if (alias.template !== 'claude-editorial') throw new Error(`Legacy alias resolved to ${alias.template}`);
  console.log(`Scaffolded and validated ${catalog.templates.length} templates across HTML, Marp, and PPTX with ${layoutCatalog.archetypes.length} layout archetypes.`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
