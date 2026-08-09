import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pptxgen from 'pptxgenjs';

const pptx = new pptxgen();
const deckTitle = {{TITLE_JS}};
const deckLanguage = {{LANGUAGE_JS}};
const templateName = {{TEMPLATE_NAME_JS}};
const outputFile = {{OUTPUT_FILE_JS}};
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Rufus Hsu';
pptx.company = 'Claude Code Slides';
pptx.subject = deckTitle;
pptx.title = deckTitle;
pptx.lang = deckLanguage;
pptx.theme = { headFontFace: {{PPTX_DISPLAY_FONT_JS}}, bodyFontFace: {{PPTX_BODY_FONT_JS}}, lang: deckLanguage };
pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'LAYOUT_WIDE';

const C = {
  canvas: {{PPTX_CANVAS_JS}}, surface: {{PPTX_SURFACE_JS}}, ink: {{PPTX_INK_JS}}, muted: {{PPTX_MUTED_JS}}, border: {{PPTX_BORDER_JS}},
  accent: {{PPTX_ACCENT_JS}}, accentText: {{PPTX_ACCENT_FOREGROUND_JS}}, accentSoft: {{PPTX_ACCENT_SOFT_JS}}, code: {{PPTX_CODE_JS}}, codeText: {{PPTX_CODE_TEXT_JS}},
  success: {{PPTX_SUCCESS_JS}}, successText: {{PPTX_SUCCESS_TEXT_JS}}, warning: {{PPTX_WARNING_JS}},
};
const F = { display: {{PPTX_DISPLAY_FONT_JS}}, body: {{PPTX_BODY_FONT_JS}}, mono: {{PPTX_MONO_FONT_JS}} };
const TOTAL = 20;
const LAYOUT_SEQUENCE = Object.freeze([
  'editorial-cover', 'hero-statement', 'chapter-index', 'before-after',
  'layered-architecture', 'metric-spotlight', 'system-map', 'evidence-claim',
  'flow-architecture', 'annotated-visual', 'infographic-story', 'code-walkthrough',
  'data-journey', 'quote-evidence', 'comparison-matrix', 'decision-path',
  'operating-loop', 'timeline', 'risk-matrix', 'closing-manifesto',
]);
const GEOMETRY_SEQUENCE = Object.freeze([
  'full-bleed', 'hero-plus-rail', 'index-rail', 'matched-comparison',
  'stacked-layers', 'metric-stage', 'hub-and-spoke', 'evidence-anchor',
  'node-flow', 'full-visual-callouts', 'scene-journey', 'terminal-stage',
  'metric-to-trend', 'quote-stage', 'matrix', 'branch-path',
  'circular-loop', 'linear-spine', 'quadrant-plus-register', 'dark-full-bleed',
]);

function text(slide, value, options = {}) {
  slide.addText(value, {
    margin: 0,
    fontFace: F.body,
    fontSize: 18,
    color: C.ink,
    breakLine: false,
    valign: 'mid',
    ...options,
  });
}
function shape(slide, type, options) { slide.addShape(type, options); }
function rule(slide, x, y, w, color = C.border, width = 1, dash = 'solid') {
  shape(slide, pptx.ShapeType.line, { x, y, w, h: 0, line: { color, width, dashType: dash } });
}
function box(slide, x, y, w, h, { fill = C.surface, line = C.border, radius = false, transparency = 0 } = {}) {
  shape(slide, radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x, y, w, h,
    rectRadius: radius ? .05 : undefined,
    fill: { color: fill, transparency },
    line: { color: line, width: 1 },
  });
}
function circle(slide, x, y, d, { fill = C.surface, line = C.ink, width = 1.2 } = {}) {
  shape(slide, pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: line, width } });
}
function label(slide, value, x, y, w = 3, options = {}) {
  text(slide, value.toUpperCase(), {
    x, y, w, h: .18,
    fontFace: F.mono, fontSize: 8.6, bold: true, charSpacing: 1.2,
    color: C.accent, ...options,
  });
}
function title(slide, value, options = {}) {
  text(slide, value, {
    x: .72, y: .92, w: 11.75, h: 1.28,
    fontFace: F.display, fontSize: 39, color: C.ink,
    bold: false, breakLine: true, fit: 'shrink', ...options,
  });
}
function body(slide, value, options = {}) {
  text(slide, value, {
    x: .72, y: 2.35, w: 8.4, h: .7,
    fontSize: 17, color: C.muted, valign: 'top', breakLine: true, fit: 'shrink', ...options,
  });
}
function base(slide, page, labelText, { dark = false, footer = true } = {}) {
  slide.background = { color: dark ? C.code : C.canvas };
  label(slide, labelText, .72, .3, 5.5);
  text(slide, `${LAYOUT_SEQUENCE[page - 1]} · ${GEOMETRY_SEQUENCE[page - 1]}`, {
    x: 7.2, y: .3, w: 5.4, h: .18, align: 'right',
    fontFace: F.mono, fontSize: 7.2, charSpacing: .45, color: dark ? '8E867D' : C.muted,
  });
  if (footer) {
    rule(slide, .72, 7.0, 11.9, dark ? '4B463E' : C.border, 1);
    text(slide, '{{SLUG}}', { x: .72, y: 7.09, w: 4.2, h: .14, fontFace: F.mono, fontSize: 7.6, color: dark ? '8E867D' : C.muted });
    text(slide, `${page} / ${TOTAL}`, { x: 11.55, y: 7.09, w: 1.05, h: .14, align: 'right', fontFace: F.mono, fontSize: 7.6, color: dark ? '8E867D' : C.muted });
  }
}
function asset(name) { return path.join(process.cwd(), 'assets', name); }
function addSvg(slide, name, x, y, w, h) { slide.addImage({ path: asset(name), x, y, w, h }); }
function note(slide, value) { slide.addNotes(value); }

function cover() {
  const s = pptx.addSlide();
  s.background = { color: C.canvas };
  text(s, '> CLAUDE CODE SLIDES', { x: .72, y: .42, w: 4.6, h: .24, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.accent, charSpacing: 1.2 });
  label(s, 'Presentation / {{DATE}}', .72, 1.42, 4.4);
  title(s, deckTitle, { y: 1.8, h: 2.15, fontSize: 53, w: 11.2 });
  body(s, 'Replace this sentence with the one promise your audience should remember.', { y: 4.4, w: 8.8, h: .7, fontSize: 20 });
  rule(s, .72, 6.72, 11.9, C.border, 1);
  text(s, `${templateName} · 20 LAYOUT STARTERS`, { x: .72, y: 6.86, w: 5.7, h: .2, fontFace: F.mono, fontSize: 8.6, color: C.muted, charSpacing: .8 });
  text(s, '→', { x: 11.9, y: 6.78, w: .7, h: .3, align: 'right', fontFace: F.mono, fontSize: 18, color: C.accent });
  shape(s, pptx.ShapeType.arc, { x: 11.55, y: .8, w: 1.05, h: 1.05, adjustPoint: .25, rotate: 12, fill: { color: C.canvas, transparency: 100 }, line: { color: C.accent, transparency: 35, width: 1.2 } });
  note(s, 'Open with the audience problem, not with a table of contents.');
}

function hero() {
  const s = pptx.addSlide(); base(s, 2, '01 / Thesis');
  title(s, 'The layout should change when the communication job changes.', { x: .72, y: 1.08, w: 8.0, h: 2.45, fontSize: 46 });
  body(s, 'Keep the visual language stable while varying composition, geometry, density, and eye path.', { x: .72, y: 4.05, w: 7.7, h: .8, fontSize: 18.5 });
  shape(s, pptx.ShapeType.line, { x: 9.0, y: 1.2, w: 0, h: 4.75, line: { color: C.border, width: 1 } });
  [['28','SEMANTIC ARCHETYPES'],['20','STARTER GEOMETRIES'],['0','CONSECUTIVE REPEATS']].forEach(([value, caption], i) => {
    const y = 1.28 + i * 1.48;
    text(s, value, { x: 9.38, y, w: 2.7, h: .62, fontFace: F.display, fontSize: 37, color: C.accent });
    text(s, caption, { x: 9.38, y: y + .72, w: 2.8, h: .28, fontFace: F.mono, fontSize: 8.1, charSpacing: .75, color: C.muted });
    if (i < 2) rule(s, 9.38, y + 1.16, 2.8, C.border, 1);
  });
  note(s, 'State the governing principle first: style stays coherent while composition follows meaning.');
}

function chapterIndex() {
  const s = pptx.addSlide(); base(s, 3, '02 / Story Map');
  text(s, '04', { x: .58, y: 1.48, w: 3.0, h: 2.45, fontFace: F.display, fontSize: 112, color: C.accent, bold: false });
  title(s, 'A deck needs a rhythm, not a pile of interchangeable pages.', { x: 3.35, y: 1.15, w: 5.1, h: 2.3, fontSize: 35 });
  body(s, 'Use the index as a promise of movement rather than a list of every topic.', { x: 3.35, y: 4.02, w: 4.8, h: .8, fontSize: 16 });
  const items = [['01','Frame','Context and tension'],['02','Reveal','System and evidence'],['03','Decide','Trade-offs and risk'],['04','Act','Owner and next step']];
  rule(s, 9.0, 1.25, 3.25, C.border, 1);
  items.forEach(([num, heading, detail], i) => {
    const y = 1.32 + i * 1.08;
    text(s, num, { x: 9.0, y: y + .18, w: .45, h: .2, fontFace: F.mono, fontSize: 8.5, color: C.accent });
    text(s, heading, { x: 9.6, y: y + .06, w: 1.9, h: .28, fontSize: 17, bold: true });
    text(s, detail, { x: 9.6, y: y + .43, w: 2.45, h: .24, fontSize: 10.5, color: C.muted });
    rule(s, 9.0, y + .9, 3.25, C.border, 1);
  });
  note(s, 'Keep the chapter map to three to five meaningful moves.');
}

function beforeAfter() {
  const s = pptx.addSlide(); base(s, 4, '03 / Transformation');
  title(s, 'Move from repeated containers to content-aware composition.', { y: .86, h: 1.25, fontSize: 38 });
  body(s, 'Use matched criteria so the audience sees the actual change.', { y: 2.12, w: 7.8, h: .4, fontSize: 15 });
  const states = [
    { x: .72, label: 'BEFORE', heading: 'Different labels, same geometry', items: ['Left copy and right card','Cards for unrelated content','Flat thumbnail rhythm'], accent: false },
    { x: 7.12, label: 'TARGET', heading: "Geometry selected by the slide's job", items: ['Systems use boundaries or hubs','Evidence becomes the anchor','Decisions end with an action'], accent: true },
  ];
  states.forEach((d) => {
    rule(s, d.x, 3.0, 5.48, d.accent ? C.accent : C.border, 2.2);
    label(s, d.label, d.x, 3.18, 1.6);
    text(s, d.heading, { x: d.x, y: 3.62, w: 5.05, h: .72, fontFace: F.display, fontSize: 25, fit: 'shrink' });
    d.items.forEach((item, i) => text(s, `—  ${item}`, { x: d.x, y: 4.62 + i * .47, w: 5.05, h: .24, fontSize: 13.2, color: C.muted }));
  });
  text(s, 'Δ', { x: 6.15, y: 4.0, w: .95, h: .7, align: 'center', fontFace: F.display, fontSize: 38, color: C.accent });
  text(s, 'MEANING\nDRIVES FORM', { x: 6.15, y: 4.8, w: .95, h: .6, align: 'center', fontFace: F.mono, fontSize: 7.2, color: C.muted, breakLine: true });
  note(s, 'Compare the current and target states using the same criteria.');
}

function layered() {
  const s = pptx.addSlide(); base(s, 5, '04 / Layered Architecture');
  title(s, 'Use layers only when responsibility changes by boundary.', { x: .72, y: 1.02, w: 5.15, h: 1.75, fontSize: 36 });
  body(s, 'Label who owns each layer, what it exposes, and where policy is enforced.', { x: .72, y: 3.0, w: 4.9, h: .82, fontSize: 16 });
  text(s, '↳ A boundary must explain responsibility—not just draw a box.', { x: .72, y: 4.3, w: 4.9, h: .55, fontFace: F.mono, fontSize: 10.8, color: C.ink, breakLine: true });
  [['01','Experience','Product teams'],['02','Application services','APIs · workflows'],['03','Platform controls','Identity · policy · observability'],['04','Infrastructure','Compute · network · data']].forEach(([num, heading, meta], i) => {
    const y = 1.32 + i * 1.08;
    box(s, 6.15, y, 6.13, .9, { fill: i === 0 ? C.accentSoft : C.surface, line: i === 0 ? C.accent : C.border });
    text(s, num, { x: 6.42, y: y + .29, w: .45, h: .18, fontFace: F.mono, fontSize: 8.3, color: C.accent });
    text(s, heading, { x: 7.03, y: y + .2, w: 2.85, h: .34, fontSize: 16.5, bold: true });
    text(s, meta, { x: 9.72, y: y + .27, w: 2.2, h: .24, align: 'right', fontFace: F.mono, fontSize: 8, color: C.muted });
  });
  note(s, 'Walk from the audience-facing layer down to the operating foundation.');
}

function metric() {
  const s = pptx.addSlide(); base(s, 6, '05 / Outcome');
  shape(s, pptx.ShapeType.line, { x: .72, y: 1.28, w: 0, h: 4.65, line: { color: C.accent, width: 4 } });
  label(s, 'Geometry diversity', 1.06, 1.32, 3.2);
  text(s, '80%', { x: .98, y: 1.88, w: 5.4, h: 1.62, fontFace: F.display, fontSize: 112, color: C.accent });
  body(s, 'of a ten-slide deck should use a distinct composition before any geometry repeats.', { x: 1.06, y: 4.02, w: 5.4, h: .92, fontSize: 18.5 });
  [['≤20%','CARD-BASED PAGES'],['≤35%','GENERIC SPLIT SCREENS'],['3','SLIDES BETWEEN RHYTHM CHANGES']].forEach(([value, caption], i) => {
    const y = 1.45 + i * 1.45;
    text(s, value, { x: 7.25, y, w: 1.7, h: .58, fontFace: F.display, fontSize: 34 });
    text(s, caption, { x: 9.02, y: y + .22, w: 2.9, h: .32, fontFace: F.mono, fontSize: 7.8, charSpacing: .65, color: C.muted });
    rule(s, 7.25, y + 1.04, 4.72, C.border, 1);
  });
  note(s, 'Replace these design-system measures with verified evidence in a production deck.');
}

function systemMap() {
  const s = pptx.addSlide(); base(s, 7, '06 / System Map');
  addSvg(s, 'system-map.svg', 2.04, 1.55, 9.25, 5.4);
  title(s, 'Map access, trust, and policy.', { y: .8, h: .62, fontSize: 30, w: 7.4 });
  body(s, 'Use a hub when orchestration is central; use the boundary to show trust and ownership.', { x: 8.35, y: .95, w: 3.75, h: .62, fontSize: 12.5 });
  note(s, 'Every connection should name access, data, protocol, or responsibility. Avoid logo clouds.');
}

function evidence() {
  const s = pptx.addSlide(); base(s, 8, '07 / Evidence');
  box(s, .72, 1.32, 5.25, 4.95, { fill: C.surface, line: C.border });
  text(s, 'AUDIENCE RECALL / ILLUSTRATIVE', { x: 1.03, y: 1.62, w: 3.3, h: .2, fontFace: F.mono, fontSize: 8.1, charSpacing: .65, color: C.muted });
  [['Repeated',34],['Mixed',58],['Purposeful',82]].forEach(([caption, value], i) => {
    const y = 2.48 + i * .92;
    text(s, caption, { x: 1.03, y, w: 1.1, h: .2, fontFace: F.mono, fontSize: 8.3, color: C.muted });
    box(s, 2.18, y + .02, 2.78, .16, { fill: C.border, line: C.border });
    box(s, 2.18, y + .02, 2.78 * value / 100, .16, { fill: i === 2 ? C.accent : C.muted, line: i === 2 ? C.accent : C.muted });
    text(s, String(value), { x: 5.1, y, w: .44, h: .2, align: 'right', fontFace: F.mono, fontSize: 8.8 });
  });
  text(s, 'Replace illustrative data with a verified source, date, and definition.', { x: 1.03, y: 5.58, w: 4.45, h: .3, fontFace: F.mono, fontSize: 7.5, color: C.muted });
  label(s, 'The claim', 6.55, 1.46, 1.8);
  title(s, 'Evidence becomes memorable when the page gives it visual priority.', { x: 6.55, y: 1.82, w: 5.75, h: 2.35, fontSize: 36 });
  body(s, 'Keep explanation adjacent, but let the chart, screenshot, quotation, or artifact remain the anchor.', { x: 6.55, y: 4.58, w: 5.05, h: .82, fontSize: 16 });
  note(s, 'This sample chart is illustrative and must be replaced with verified evidence.');
}

function flow() {
  const s = pptx.addSlide(); base(s, 9, '08 / Flow Architecture');
  title(s, 'Show what moves, who owns it, and why the next step exists.', { y: .86, h: 1.18, fontSize: 36 });
  body(s, 'Direct labels beat legends. Every arrow should name data, protocol, identity, or decision.', { y: 2.14, w: 10.6, h: .4, fontSize: 14.5 });
  shape(s, pptx.ShapeType.line, { x: 1.08, y: 4.45, w: 11.15, h: -.35, line: { color: C.accent, width: 2.5, beginArrowType: 'none', endArrowType: 'triangle' } });
  const nodes = [
    { x: 1.0, y: 3.1, n: '01', h: 'Source', b: 'Brief, data, code, research', accent: false },
    { x: 4.0, y: 4.18, n: '02', h: 'Orchestrate', b: 'Plan the story and call tools', accent: false },
    { x: 7.0, y: 2.98, n: '03', h: 'Validate', b: 'Check claims, export, and risk', accent: true },
    { x: 10.0, y: 4.05, n: '04', h: 'Act', b: 'Decision, owner, next step', accent: false },
  ];
  nodes.forEach((d) => {
    rule(s, d.x, d.y, 2.3, d.accent ? C.accent : C.ink, 2.1);
    circle(s, d.x, d.y + .24, .52, { fill: d.accent ? C.accent : C.canvas, line: d.accent ? C.accent : C.ink, width: 1.3 });
    text(s, d.n, { x: d.x, y: d.y + .39, w: .52, h: .14, align: 'center', fontFace: F.mono, fontSize: 7.6, color: d.accent ? C.accentText : C.ink });
    text(s, d.h, { x: d.x + .72, y: d.y + .26, w: 1.55, h: .3, fontSize: 16, bold: true });
    text(s, d.b, { x: d.x + .72, y: d.y + .68, w: 1.7, h: .55, fontSize: 10.2, color: C.muted, fit: 'shrink' });
  });
  [['context',3.0],['artifacts',6.2],['evidence',9.25]].forEach(([caption, x]) => text(s, caption, { x, y: 4.2, w: .7, h: .2, align: 'center', fontFace: F.mono, fontSize: 7.4, color: C.muted, fill: { color: C.canvas } }));
  note(s, 'Replace this generic path with the real request, data, or agent flow.');
}

function annotatedVisual() {
  const s = pptx.addSlide(); base(s, 10, '09 / Annotated Visual');
  title(s, 'Let one real artifact dominate—then explain only what changes the decision.', { x: .72, y: 1.02, w: 4.25, h: 1.75, fontSize: 33 });
  body(s, 'Use two to four callouts. The audience should still be able to see the underlying interface or architecture.', { x: .72, y: 3.05, w: 4.1, h: 1.0, fontSize: 15 });
  // Editable product/editor mock.
  box(s, 5.0, 1.12, 7.35, .52, { fill: C.code, line: '3B3730', radius: true });
  text(s, 'architecture-review.deck', { x: 5.23, y: 1.29, w: 3.2, h: .16, fontFace: F.mono, fontSize: 7.8, color: 'C8BEB1' });
  text(s, 'Preview · Export', { x: 10.6, y: 1.29, w: 1.45, h: .16, align: 'right', fontFace: F.mono, fontSize: 7.8, color: 'C8BEB1' });
  box(s, 5.0, 1.64, 7.35, 4.72, { fill: C.surface, line: C.border });
  box(s, 5.0, 1.64, .9, 4.72, { fill: C.accentSoft, line: C.border });
  for (let i = 0; i < 4; i += 1) box(s, 5.18, 1.95 + i * .82, .55, .55, { fill: C.surface, line: C.border });
  box(s, 10.5, 1.64, 1.85, 4.72, { fill: C.accentSoft, line: C.border });
  label(s, 'System map', 6.3, 2.15, 1.6);
  text(s, 'One visual anchor', { x: 6.3, y: 2.58, w: 3.7, h: .52, fontFace: F.display, fontSize: 27 });
  rule(s, 6.55, 4.25, 3.25, C.accent, 2.2);
  [6.55, 7.65, 8.75, 9.85].forEach((x, i) => circle(s, x, 3.92, .66, { fill: i === 1 ? C.accentSoft : C.surface, line: i === 1 ? C.accent : C.ink, width: 1.2 }));
  label(s, 'AI Director', 10.75, 2.02, 1.2);
  text(s, 'Use a boundary because policy changes here.', { x: 10.75, y: 2.5, w: 1.25, h: .75, fontSize: 9.5, color: C.muted, fit: 'shrink' });
  rule(s, 10.75, 3.38, 1.25, C.border, 1);
  text(s, 'Move caveats to speaker notes.', { x: 10.75, y: 3.62, w: 1.25, h: .65, fontSize: 9.5, color: C.muted, fit: 'shrink' });
  [['1',5.55,1.92],['2',10.8,2.9],['3',11.75,5.35]].forEach(([n,x,y]) => {
    circle(s, x, y, .42, { fill: C.accent, line: C.accent, width: 1 });
    text(s, n, { x, y: y + .12, w: .42, h: .12, align: 'center', fontFace: F.mono, fontSize: 7.6, color: C.accentText, bold: true });
  });
  text(s, '1  Hierarchy keeps the canvas dominant.', { x: 5.0, y: 6.54, w: 2.35, h: .22, fontSize: 9.2, color: C.muted });
  text(s, '2  Context stays adjacent to the artifact.', { x: 7.55, y: 6.54, w: 2.4, h: .22, fontSize: 9.2, color: C.muted });
  text(s, '3  Action remains visible without another grid.', { x: 10.0, y: 6.54, w: 2.35, h: .22, fontSize: 9.2, color: C.muted, fit: 'shrink' });
  note(s, 'Use a real screenshot or architecture artifact in production. Avoid covering it with labels.');
}

function infographicStory() {
  const s = pptx.addSlide(); base(s, 11, '10 / Infographic Story');
  addSvg(s, 'infographic-story.svg', 2.04, 1.55, 9.25, 5.4);
  title(s, 'Turn the argument into a scene.', { y: .8, h: .62, fontSize: 30, w: 7.2 });
  body(s, 'Make the outcome tangible—not a generic result box.', { x: 8.05, y: .95, w: 4.0, h: .45, fontSize: 12.5 });
  note(s, 'Keep the human in control and make the result concrete.');
}

function codeWalkthrough() {
  const s = pptx.addSlide(); base(s, 12, '11 / Build');
  title(s, 'Use code to prove the workflow—not to decorate the page.', { x: .72, y: 1.05, w: 4.5, h: 1.72, fontSize: 34 });
  body(s, 'Crop to the lines the audience needs and pair them with the visible outcome.', { x: .72, y: 3.12, w: 4.2, h: .85, fontSize: 15.5 });
  text(s, '↳ The command is evidence; the result is the story.', { x: .72, y: 4.55, w: 4.25, h: .34, fontFace: F.mono, fontSize: 10.5 });
  box(s, 5.35, 1.16, 6.9, 5.15, { fill: C.code, line: '3B3730', radius: true });
  rule(s, 5.35, 1.75, 6.9, '3D3932', 1);
  text(s, '~/project', { x: 5.67, y: 1.42, w: 2, h: .18, fontFace: F.mono, fontSize: 8.3, color: 'AAA197' });
  text(s, '$ codex-slides init "Architecture Review" \\\n  --format pptx \\\n  --template claude-editorial\n\n✓ 20 layout starters created\n✓ geometry audit passed\n✓ editable PPTX source generated', {
    x: 5.68, y: 2.08, w: 5.95, h: 3.55, fontFace: F.mono, fontSize: 12.8, color: C.codeText, valign: 'top', breakLine: true,
  });
  note(s, 'Keep a screenshot or recorded fallback for live demos.');
}

function dataJourney() {
  const s = pptx.addSlide(); base(s, 13, '12 / Data Journey');
  addSvg(s, 'data-journey.svg', 2.04, 1.55, 9.25, 5.4);
  title(s, 'Show state, movement, and action.', { y: .8, h: .62, fontSize: 30, w: 7.6 });
  body(s, 'A large metric earns attention; the trend and definition make it trustworthy.', { x: 8.45, y: .95, w: 3.7, h: .58, fontSize: 12.2 });
  note(s, 'Pair the metric with source, date, definition, direction, and decision implication.');
}

function quoteEvidence() {
  const s = pptx.addSlide(); base(s, 14, '13 / Voice of Evidence');
  text(s, '“', { x: .42, y: .8, w: 2.2, h: 2.3, fontFace: F.display, fontSize: 144, color: C.accentSoft });
  text(s, 'We stopped debating slide decoration and started discussing the architecture decision.', {
    x: .85, y: 1.35, w: 8.15, h: 3.85, fontFace: F.display, fontSize: 38, color: C.ink, breakLine: true, fit: 'shrink',
  });
  rule(s, .85, 5.65, 7.8, C.border, 1);
  text(s, 'Verified participant or customer', { x: .85, y: 5.83, w: 3.7, h: .25, fontSize: 14.2, bold: true });
  text(s, 'Role · organization · interview date', { x: .85, y: 6.2, w: 3.7, h: .2, fontFace: F.mono, fontSize: 8.2, color: C.muted });
  box(s, 9.35, 1.68, 2.85, 3.85, { fill: C.accentSoft, line: C.accent });
  label(s, 'Why it matters', 9.68, 2.0, 2.1);
  text(s, 'A quotation is evidence only when the source is real, the context is clear, and the interpretation is explicit.', { x: 9.68, y: 2.62, w: 2.2, h: 2.1, fontSize: 16.5, breakLine: true, fit: 'shrink' });
  note(s, 'Never fabricate a quotation. Replace this placeholder with an authorized, verifiable source.');
}

function comparison() {
  const s = pptx.addSlide(); base(s, 15, '14 / Trade-off');
  title(s, 'Compare options on the criteria that determine the decision.', { y: .82, h: 1.18, fontSize: 36 });
  const rows = [
    ['CRITERION','REPEATED TEMPLATE','VISUAL GRAMMAR V2'],
    ['Speed','Fast first draft','Fast with reusable archetypes'],
    ['Clarity','One generic frame','Geometry follows the message'],
    ['Rhythm','Different labels, similar thumbnails','Audited by geometry and density'],
    ['Maintenance','Many one-off fixes','Shared primitives and tests'],
  ];
  rows.forEach((row, r) => {
    const y = 2.35 + r * .76;
    [ .72, 3.55, 7.95 ].forEach((x, c) => {
      const widths = [2.83, 4.4, 4.67];
      const recommended = r === 3 && c === 2;
      box(s, x, y, widths[c], .76, { fill: recommended ? C.accentSoft : C.surface, line: C.border });
      text(s, row[c], { x: x + .18, y: y + .22, w: widths[c] - .36, h: .28, fontFace: r === 0 ? F.mono : F.body, fontSize: r === 0 ? 8.2 : 12.2, bold: r === 0 || c === 0 || recommended, charSpacing: r === 0 ? .7 : 0, color: r === 0 ? C.muted : (c === 0 || recommended ? C.ink : C.muted), fit: 'shrink' });
    });
  });
  note(s, 'Use the same criteria for every option before highlighting the recommendation.');
}

function decisionPath() {
  const s = pptx.addSlide(); base(s, 16, '15 / Decision');
  addSvg(s, 'decision-path.svg', 2.04, 1.55, 9.25, 5.4);
  title(s, 'Turn choices into an actionable path.', { y: .8, h: .62, fontSize: 30, w: 7.1 });
  body(s, 'Make the evaluation point explicit, then show the consequence of proceeding or collecting evidence.', { x: 7.55, y: .94, w: 4.6, h: .62, fontSize: 12.2 });
  note(s, 'End with an owner, next action, timing, and stop conditions.');
}

function operatingLoop() {
  const s = pptx.addSlide(); base(s, 17, '16 / Operating Model');
  addSvg(s, 'operating-loop.svg', 2.04, 1.55, 9.25, 5.4);
  title(s, 'Use loops only when feedback changes the outcome.', { y: .8, h: .62, fontSize: 29, w: 7.6 });
  body(s, 'Anchor the loop on one measurable outcome, then name cadence, guardrails, and ownership.', { x: 7.85, y: .94, w: 4.3, h: .62, fontSize: 12.2 });
  note(s, 'Explain what feedback changes and who acts on it.');
}

function timeline() {
  const s = pptx.addSlide(); base(s, 18, '17 / Adoption');
  title(s, 'Roll out the visual grammar without rewriting the brand.', { y: .86, h: 1.2, fontSize: 36 });
  shape(s, pptx.ShapeType.line, { x: 1.0, y: 3.42, w: 11.25, h: 0, line: { color: C.border, width: 1.2 } });
  [['01','Catalog','Name archetypes, geometry, and purpose.'],['02','Scaffold','Ship diverse starters in every format.'],['03','Validate','Audit sequence, density, and export.'],['04','Learn','Add patterns from real decks.']].forEach(([num, heading, detail], i) => {
    const x = .92 + i * 3.02;
    box(s, x, 3.1, .64, .64, { fill: i === 1 ? C.accent : C.canvas, line: i === 1 ? C.accent : C.border });
    text(s, num, { x, y: 3.32, w: .64, h: .16, align: 'center', fontFace: F.mono, fontSize: 8.2, color: i === 1 ? C.accentText : C.muted });
    text(s, heading, { x, y: 4.02, w: 2.5, h: .34, fontSize: 18.5, bold: true });
    text(s, detail, { x, y: 4.56, w: 2.42, h: .78, fontSize: 13.0, color: C.muted, fit: 'shrink' });
  });
  note(s, 'Mark the current phase. A roadmap should show changing capability, not just dates.');
}

function risk() {
  const s = pptx.addSlide(); base(s, 19, '18 / Risk');
  title(s, 'Variation without rules becomes noise.', { x: .72, y: .94, w: 6.25, h: 1.3, fontSize: 37 });
  [['Low impact','Cosmetic drift',false],['High impact','Unreadable density',false],['Low probability','Export edge case',false],['High probability','Different names, same geometry',true]].forEach(([caption, heading, hot], i) => {
    const x = .72 + (i % 2) * 2.94;
    const y = 2.55 + Math.floor(i / 2) * 1.48;
    box(s, x, y, 2.94, 1.48, { fill: hot ? C.accentSoft : C.surface, line: hot ? C.accent : C.border });
    text(s, caption.toUpperCase(), { x: x + .22, y: y + .2, w: 2.5, h: .18, fontFace: F.mono, fontSize: 7.4, charSpacing: .65, color: C.muted });
    text(s, heading, { x: x + .22, y: y + .73, w: 2.45, h: .42, fontSize: 14.8, bold: true, fit: 'shrink' });
  });
  [['01','Novelty over meaning','Use role and dominant-element selection.'],['02','Split-screen default','Cap generic splits near 35%.'],['03','Theme drift','Keep shared tokens and page chrome.']].forEach(([num, heading, detail], i) => {
    const y = 1.7 + i * 1.4;
    text(s, num, { x: 7.3, y, w: .45, h: .2, fontFace: F.mono, fontSize: 8.7, color: C.accent });
    text(s, heading, { x: 8.0, y: y - .02, w: 3.7, h: .34, fontSize: 17.5, bold: true });
    text(s, detail, { x: 8.0, y: y + .45, w: 3.75, h: .42, fontSize: 12.8, color: C.muted });
    rule(s, 7.3, y + 1.04, 4.75, C.border, 1);
  });
  note(s, 'Name the mitigation and owner for real risks. The matrix should prioritize action.');
}

function closing() {
  const s = pptx.addSlide(); base(s, 20, 'The decision', { dark: true });
  title(s, 'Keep the style.\nExpand the visual grammar.', { y: 1.34, w: 11.15, h: 2.65, fontSize: 50, color: C.codeText, breakLine: true });
  body(s, 'Choose geometry by communication purpose, then let the design system keep the deck coherent.', { y: 4.34, w: 9.3, h: .9, fontSize: 19.5, color: 'B9B0A5' });
  box(s, .72, 5.72, 3.25, .58, { fill: C.code, line: '4B463E' });
  text(s, '$  build with purpose', { x: .94, y: 5.9, w: 2.8, h: .18, fontFace: F.mono, fontSize: 10.8, color: C.codeText });
  note(s, 'Ask for one concrete action, owner, and timing. Stop after the ask.');
}

cover();
hero();
chapterIndex();
beforeAfter();
layered();
metric();
systemMap();
evidence();
flow();
annotatedVisual();
infographicStory();
codeWalkthrough();
dataJourney();
quoteEvidence();
comparison();
decisionPath();
operatingLoop();
timeline();
risk();
closing();

if (LAYOUT_SEQUENCE.length !== TOTAL || GEOMETRY_SEQUENCE.length !== TOTAL) {
  throw new Error('Layout and geometry sequences must match the generated slide count.');
}
const outputDirectory = path.resolve(process.cwd(), 'dist');
await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, outputFile);
await pptx.writeFile({ fileName: outputPath });
console.log(`Wrote ${outputPath}`);
