import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('creation workflow is plan-first and keeps narrative decisions outside implementation', async () => {
  const [storytelling, createDeck, deckArchitect] = await Promise.all([
    read('references/storytelling.md'),
    read('skills/create-deck/SKILL.md'),
    read('skills/deck-architect/SKILL.md'),
  ]);

  for (const content of [storytelling, createDeck, deckArchitect]) {
    assert.match(content, /deck-plan\.md/);
    assert.match(content, /Direction Lock/i);
    assert.match(content, /Narrative Review/i);
    assert.match(content, /Verified[\s\S]*Derived[\s\S]*Assumption[\s\S]*Proposal/i);
  }

  assert.match(createDeck, /information shape[\s\S]*visual form[\s\S]*layout archetype/i);
  assert.match(createDeck, /visible takeaway callout is default-off/i);
  assert.match(deckArchitect, /section-continuity/i);
  assert.match(deckArchitect, /not slide implementation code/i);
});

test('semantic layout selection distinguishes information structure from box styling', async () => {
  const [layoutSystem, visualDirector] = await Promise.all([
    read('references/layout-system.md'),
    read('skills/visual-director/SKILL.md'),
  ]);

  for (const content of [layoutSystem, visualDirector]) {
    assert.match(content, /information shape/i);
    assert.match(content, /visual form/i);
    assert.match(content, /protocol/i);
    assert.match(content, /native table/i);
    assert.match(content, /consecutive/i);
    assert.match(content, /20%/);
  }

  assert.match(layoutSystem, /message → evidence → information shape → visual form → layout archetype/i);
  assert.match(layoutSystem, /protocol-lifelines/);
  assert.match(layoutSystem, /Expectation → reality → root cause/i);
  assert.match(visualDirector, /layoutBlueprint/);
});

test('review workflows check plan fidelity and semantic layout drift', async () => {
  const [reviewDeck, deckReviewer, checklist] = await Promise.all([
    read('skills/review-deck/SKILL.md'),
    read('skills/deck-reviewer/SKILL.md'),
    read('references/review-checklist.md'),
  ]);

  for (const content of [reviewDeck, deckReviewer, checklist]) {
    assert.match(content, /plan fidelity/i);
    assert.match(content, /deck-plan\.md/);
    assert.match(content, /information shape/i);
    assert.match(content, /native table/i);
  }

  assert.match(deckReviewer, /silent changes/i);
  assert.match(reviewDeck, /Update `deck-plan\.md`/);
});
