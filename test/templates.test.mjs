import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(
  await readFile(new URL('../templates/catalog.json', import.meta.url), 'utf8'),
);

test('template catalog is unique, complete, and portable', () => {
  assert.equal(catalog.version, 1);
  assert.ok(Array.isArray(catalog.templates));
  assert.ok(catalog.templates.length >= 7);

  const names = catalog.templates.map((template) => template.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.includes(catalog.default));

  for (const template of catalog.templates) {
    assert.match(template.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(template.displayName);
    assert.ok(template.description);
    assert.deepEqual(template.formats, ['html', 'marp', 'pptx']);
    assert.ok(['light', 'dark'].includes(template.mode));
    assert.ok(template.pattern);
    assert.ok(Array.isArray(template.useCases));
    assert.ok(template.useCases.length >= 2);

    for (const value of Object.values(template.palette)) {
      assert.match(value, /^#[0-9A-F]{6}$/);
    }
    for (const key of [
      'cssDisplay',
      'cssBody',
      'cssMono',
      'pptxDisplay',
      'pptxBody',
      'pptxMono',
    ]) {
      assert.ok(template.fonts[key]);
    }
  }
});
