import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pptxgen from 'pptxgenjs';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Rufus Hsu';
pptx.company = 'Claude Code Slides';
pptx.subject = '{{TITLE}}';
pptx.title = '{{TITLE}}';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Georgia',
  bodyFontFace: 'Aptos',
  lang: 'en-US',
};

const C = {
  canvas: 'F7F3EC',
  surface: 'FFFDF9',
  ink: '211F1B',
  muted: '6F6962',
  border: 'D8D0C6',
  accent: 'D97757',
  accentSoft: 'F1D9CD',
  code: '27241F',
  codeText: 'F8F3EA',
  success: '7FB08A',
};

const FONT = {
  display: 'Georgia',
  body: 'Aptos',
  mono: 'Aptos Mono',
};

const W = 13.333;
const H = 7.5;
const totalSlides = 5;

function addBase(slide, page, section, { dark = false } = {}) {
  slide.background = { color: dark ? C.code : C.canvas };
  slide.addText(section.toUpperCase(), {
    x: 0.72,
    y: 0.34,
    w: 5.8,
    h: 0.24,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 10,
    bold: true,
    charSpacing: 1.8,
    color: C.accent,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.72,
    y: 7.02,
    w: 11.9,
    h: 0,
    line: { color: dark ? '4B463E' : C.border, width: 1 },
  });
  slide.addText('{{SLUG}}', {
    x: 0.72,
    y: 7.11,
    w: 4.5,
    h: 0.16,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 8.5,
    color: dark ? '8E867D' : C.muted,
    charSpacing: 0.8,
  });
  slide.addText(`${page} / ${totalSlides}`, {
    x: 11.65,
    y: 7.11,
    w: 0.98,
    h: 0.16,
    margin: 0,
    align: 'right',
    fontFace: FONT.mono,
    fontSize: 8.5,
    color: dark ? '8E867D' : C.muted,
  });
}

function addTitle(slide, text, options = {}) {
  slide.addText(text, {
    x: options.x ?? 0.72,
    y: options.y ?? 1.12,
    w: options.w ?? 11.55,
    h: options.h ?? 1.55,
    margin: 0,
    fontFace: FONT.display,
    fontSize: options.fontSize ?? 43,
    bold: false,
    breakLine: false,
    color: options.color ?? C.ink,
    valign: 'mid',
    ...options,
  });
}

function addBody(slide, text, options = {}) {
  slide.addText(text, {
    x: options.x ?? 0.72,
    y: options.y ?? 2.95,
    w: options.w ?? 8.5,
    h: options.h ?? 0.9,
    margin: 0,
    fontFace: FONT.body,
    fontSize: options.fontSize ?? 19,
    color: options.color ?? C.muted,
    breakLine: false,
    valign: 'top',
    ...options,
  });
}

function addCover() {
  const slide = pptx.addSlide();
  slide.background = { color: C.canvas };
  slide.addText('>  CLAUDE CODE SLIDES', {
    x: 0.72,
    y: 0.42,
    w: 4.6,
    h: 0.25,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 10,
    bold: true,
    color: C.accent,
    charSpacing: 1.2,
  });
  slide.addText('PRESENTATION / {{DATE}}', {
    x: 0.72,
    y: 1.53,
    w: 4.3,
    h: 0.23,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 10,
    bold: true,
    color: C.accent,
    charSpacing: 1.8,
  });
  addTitle(slide, '{{TITLE}}', { y: 1.9, h: 2.25, fontSize: 54 });
  addBody(slide, 'Replace this sentence with the one promise your audience should remember.', {
    y: 4.48,
    w: 8.8,
    h: 0.78,
    fontSize: 21,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.72,
    y: 6.75,
    w: 11.9,
    h: 0,
    line: { color: C.border, width: 1 },
  });
  slide.addText('PREPARED WITH CLAUDE CODE', {
    x: 0.72,
    y: 6.91,
    w: 4.3,
    h: 0.2,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 9,
    color: C.muted,
    charSpacing: 1,
  });
  slide.addNotes('Open with the audience problem, then state the one promise this deck will prove.');
  slide.addText('→', {
    x: 11.95,
    y: 6.84,
    w: 0.68,
    h: 0.32,
    margin: 0,
    align: 'right',
    fontFace: FONT.mono,
    fontSize: 20,
    color: C.accent,
  });
}

function addThesis() {
  const slide = pptx.addSlide();
  addBase(slide, 2, '01 / The shift');
  addTitle(slide, 'The best slide makes one idea impossible to miss.', {
    y: 1.03,
    w: 8.15,
    h: 2.45,
    fontSize: 44,
  });
  addBody(slide, 'Use this page for the central change, tension, or insight that frames the rest of the story.', {
    y: 3.78,
    w: 7.4,
    h: 1.05,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 9.25,
    y: 1.35,
    w: 3.1,
    h: 4.5,
    fill: { color: C.surface, transparency: 12 },
    line: { color: C.border, width: 1 },
  });
  slide.addText('1', {
    x: 9.62,
    y: 2.05,
    w: 2.35,
    h: 1.75,
    margin: 0,
    align: 'center',
    fontFace: FONT.display,
    fontSize: 104,
    color: C.accent,
  });
  slide.addNotes('Pause after the headline. Explain the central change or tension without reading the slide.');
  slide.addText('IDEA PER SLIDE', {
    x: 9.62,
    y: 4.48,
    w: 2.35,
    h: 0.36,
    margin: 0,
    align: 'center',
    fontFace: FONT.mono,
    fontSize: 12,
    bold: true,
    charSpacing: 1.5,
    color: C.ink,
  });
}

function addFlowNode(slide, x, index, title, body, accent = false) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y: 3.34,
    w: 3.25,
    h: 2.27,
    fill: { color: accent ? C.accentSoft : C.surface, transparency: accent ? 0 : 10 },
    line: { color: accent ? C.accent : C.border, width: 1.1 },
  });
  slide.addText(index, {
    x: x + 0.25,
    y: 3.62,
    w: 0.65,
    h: 0.2,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 9,
    bold: true,
    color: C.accent,
  });
  slide.addText(title, {
    x: x + 0.25,
    y: 4.33,
    w: 2.7,
    h: 0.36,
    margin: 0,
    fontFace: FONT.body,
    fontSize: 21,
    bold: true,
    color: C.ink,
  });
  slide.addText(body, {
    x: x + 0.25,
    y: 4.86,
    w: 2.7,
    h: 0.52,
    margin: 0,
    fontFace: FONT.body,
    fontSize: 13.5,
    color: C.muted,
  });
}

function addSystemMap() {
  const slide = pptx.addSlide();
  slide.addNotes('Walk left to right. Name the owner, data or decision crossing each boundary, and the reason the next step exists.');
  addBase(slide, 3, '02 / System map');
  addTitle(slide, 'Show the path, the owner, and the boundary.', {
    y: 0.92,
    h: 1.15,
    fontSize: 39,
  });
  addBody(slide, 'Direct labels beat legends. Every arrow should explain what moves and why.', {
    y: 2.22,
    w: 8.7,
    h: 0.55,
    fontSize: 16,
  });
  addFlowNode(slide, 0.72, '01', 'Source', 'Brief, data, code, or evidence');
  addFlowNode(slide, 5.04, '02', 'Argument', 'One coherent narrative', true);
  addFlowNode(slide, 9.36, '03', 'Action', 'A decision the room can make');
  slide.addText('→', {
    x: 4.14,
    y: 4.13,
    w: 0.46,
    h: 0.5,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 27,
    color: C.accent,
    align: 'center',
  });
  slide.addText('→', {
    x: 8.46,
    y: 4.13,
    w: 0.46,
    h: 0.5,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 27,
    color: C.accent,
    align: 'center',
  });
}

function addTerminal() {
  const slide = pptx.addSlide();
  slide.addNotes('Use the command as evidence of the workflow. Keep a screenshot or recorded fallback for any live demo.');
  addBase(slide, 4, '03 / Build');
  addTitle(slide, 'Turn a brief into a working deck from the terminal.', {
    y: 1.06,
    w: 5.3,
    h: 2.2,
    fontSize: 37,
  });
  addBody(slide, 'Keep commands short enough to read from the back of the room.', {
    y: 3.55,
    w: 4.95,
    h: 0.82,
    fontSize: 17,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 6.45,
    y: 1.18,
    w: 5.9,
    h: 4.85,
    fill: { color: C.code },
    line: { color: '3B3730', width: 1 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 6.45,
    y: 1.76,
    w: 5.9,
    h: 0,
    line: { color: '3D3932', width: 1 },
  });
  slide.addText('~/project', {
    x: 6.76,
    y: 1.4,
    w: 2.3,
    h: 0.18,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 9,
    color: 'AAA197',
  });
  slide.addText(
    '$ claude\n# inside Claude Code\n> /claude-code-slides:create-deck\n  "Architecture review for cloud engineers"\n\n✓ outline approved\n✓ 8 slides generated\n✓ validation passed',
    {
      x: 6.82,
      y: 2.08,
      w: 5.15,
      h: 3.42,
      margin: 0,
      fontFace: FONT.mono,
      fontSize: 14,
      color: C.codeText,
      breakLine: false,
      valign: 'top',
    },
  );
}

function addClosing() {
  const slide = pptx.addSlide();
  slide.addNotes('Ask for one concrete action, owner, and timing. Stop after the ask.');
  addBase(slide, 5, 'The decision', { dark: true });
  addTitle(slide, 'End with the action,\nnot the recap.', {
    y: 1.42,
    w: 10.9,
    h: 2.45,
    fontSize: 51,
    color: C.codeText,
  });
  addBody(slide, 'Replace this with the decision or next step you need from the room.', {
    y: 4.35,
    w: 8.5,
    h: 0.8,
    fontSize: 20,
    color: 'B9B0A5',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.72,
    y: 5.75,
    w: 3.45,
    h: 0.58,
    fill: { color: C.code, transparency: 100 },
    line: { color: '4B463E', width: 1 },
  });
  slide.addText('$  start the conversation', {
    x: 0.94,
    y: 5.94,
    w: 3.0,
    h: 0.18,
    margin: 0,
    fontFace: FONT.mono,
    fontSize: 11,
    color: C.codeText,
  });
}

addCover();
addThesis();
addSystemMap();
addTerminal();
addClosing();

const outputDirectory = path.resolve(process.cwd(), 'dist');
await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, '{{OUTPUT_FILE}}');
await pptx.writeFile({ fileName: outputPath });
console.log(`Wrote ${outputPath}`);
