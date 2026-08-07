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
pptx.theme = { headFontFace: 'Georgia', bodyFontFace: 'Aptos', lang: 'en-US' };

const C = {
  canvas: 'F7F3EC', surface: 'FFFDF9', ink: '211F1B', muted: '6F6962', border: 'D8D0C6',
  accent: 'D97757', accentSoft: 'F1D9CD', code: '27241F', codeText: 'F8F3EA',
  success: '7FB08A', warning: 'A56A32',
};
const F = { display: 'Georgia', body: 'Aptos', mono: 'Aptos Mono' };
const TOTAL = 12;
const LAYOUT_SEQUENCE = Object.freeze([
  'editorial-cover', 'hero-statement', 'before-after', 'layered-architecture',
  'flow-architecture', 'metric-spotlight', 'evidence-claim', 'code-walkthrough',
  'comparison-matrix', 'timeline', 'risk-matrix', 'closing-manifesto',
]);

function text(slide, value, options = {}) {
  slide.addText(value, { margin: 0, fontFace: F.body, fontSize: 18, color: C.ink, breakLine: false, ...options });
}
function shape(slide, type, options) { slide.addShape(type, options); }
function base(slide, page, label, dark = false) {
  slide.background = { color: dark ? C.code : C.canvas };
  text(slide, label.toUpperCase(), { x: .72, y: .32, w: 5.8, h: .22, fontFace: F.mono, fontSize: 9.2, bold: true, charSpacing: 1.5, color: C.accent });
  text(slide, LAYOUT_SEQUENCE[page - 1], { x: 8.1, y: .32, w: 4.5, h: .22, align: 'right', fontFace: F.mono, fontSize: 7.8, charSpacing: .8, color: dark ? '8E867D' : C.muted });
  shape(slide, pptx.ShapeType.line, { x: .72, y: 7.02, w: 11.9, h: 0, line: { color: dark ? '4B463E' : C.border, width: 1 } });
  text(slide, '{{SLUG}}', { x: .72, y: 7.12, w: 4.4, h: .16, fontFace: F.mono, fontSize: 8, charSpacing: .7, color: dark ? '8E867D' : C.muted });
  text(slide, `${page} / ${TOTAL}`, { x: 11.6, y: 7.12, w: 1, h: .16, align: 'right', fontFace: F.mono, fontSize: 8, color: dark ? '8E867D' : C.muted });
}
function title(slide, value, options = {}) {
  text(slide, value, { x: .72, y: 1.02, w: 11.7, h: 1.48, fontFace: F.display, fontSize: 42, color: C.ink, valign: 'mid', ...options });
}
function body(slide, value, options = {}) {
  text(slide, value, { x: .72, y: 2.72, w: 8.6, h: .8, fontSize: 18, color: C.muted, valign: 'top', ...options });
}
function panel(slide, x, y, w, h, accent = false) {
  shape(slide, pptx.ShapeType.rect, { x, y, w, h, fill: { color: accent ? C.accentSoft : C.surface, transparency: accent ? 0 : 14 }, line: { color: accent ? C.accent : C.border, width: 1 } });
}

function cover() {
  const s = pptx.addSlide(); s.background = { color: C.canvas };
  text(s, '> CLAUDE CODE SLIDES', { x: .72, y: .42, w: 4.6, h: .24, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.accent, charSpacing: 1.2 });
  text(s, 'PRESENTATION / {{DATE}}', { x: .72, y: 1.5, w: 4.4, h: .22, fontFace: F.mono, fontSize: 9.5, bold: true, color: C.accent, charSpacing: 1.6 });
  title(s, '{{TITLE}}', { y: 1.88, h: 2.2, fontSize: 54 });
  body(s, 'Replace this sentence with the one promise your audience should remember.', { y: 4.45, w: 8.8, h: .7, fontSize: 21 });
  shape(s, pptx.ShapeType.line, { x: .72, y: 6.76, w: 11.9, h: 0, line: { color: C.border, width: 1 } });
  text(s, '{{TEMPLATE_NAME}} · 12 LAYOUT STARTERS', { x: .72, y: 6.92, w: 5.4, h: .2, fontFace: F.mono, fontSize: 8.8, color: C.muted, charSpacing: .9 });
  text(s, '→', { x: 11.9, y: 6.84, w: .7, h: .32, align: 'right', fontFace: F.mono, fontSize: 19, color: C.accent });
  s.addNotes('Open with the audience problem, then state the one promise this deck will prove.');
}
function hero() {
  const s = pptx.addSlide(); base(s, 2, '01 / Thesis');
  title(s, 'The layout should change when the communication job changes.', { w: 8.1, h: 2.55, fontSize: 47 });
  body(s, 'Keep the visual language stable while varying composition, density, and eye path.', { y: 4.15, w: 7.7 });
  shape(s, pptx.ShapeType.line, { x: 9.02, y: 1.25, w: 0, h: 4.7, line: { color: C.border, width: 1 } });
  [['16','AVAILABLE ARCHETYPES'],['8+','UNIQUE LAYOUTS IN TEN PAGES'],['0','CONSECUTIVE REPEATS']].forEach(([v,l],i)=>{
    const y=1.32+i*1.48; text(s,v,{x:9.4,y,w:2.6,h:.62,fontFace:F.display,fontSize:37,color:C.accent});
    text(s,l,{x:9.4,y:y+.72,w:2.7,h:.3,fontFace:F.mono,fontSize:8.3,charSpacing:.8,color:C.muted});
  });
  s.addNotes('State the governing principle before showing examples. The theme remains stable while the layout follows meaning.');
}
function beforeAfter() {
  const s = pptx.addSlide(); base(s, 3, '02 / Transformation');
  title(s, 'Move from repeated cards to content-aware composition.', { y: .88, h: 1.18, fontSize: 39 });
  body(s, 'Use matched criteria so the audience sees the actual change.', { y: 2.14, w: 8.5, h: .4, fontSize: 15.5 });
  const data=[{x:.72,label:'BEFORE',head:'One structure for every page',items:['Repeated split layout','Cards for unrelated content','Flat visual rhythm'],a:false},{x:7.1,label:'TARGET',head:'Layout selected by slide role',items:['Architecture uses layers or flows','Evidence gets visual priority','Decisions end with a clear ask'],a:true}];
  data.forEach(d=>{shape(s,pptx.ShapeType.line,{x:d.x,y:3,w:5.48,h:0,line:{color:d.a?C.accent:C.border,width:2.2}});text(s,d.label,{x:d.x,y:3.2,w:1.6,h:.2,fontFace:F.mono,fontSize:9,bold:true,charSpacing:1.3,color:C.accent});text(s,d.head,{x:d.x,y:3.7,w:4.9,h:.82,fontFace:F.display,fontSize:26,color:C.ink});d.items.forEach((item,i)=>text(s,`—  ${item}`,{x:d.x,y:4.78+i*.48,w:5.05,h:.25,fontSize:14.2,color:C.muted}));});
  text(s,'→',{x:6.22,y:4.45,w:.9,h:.4,align:'center',fontFace:F.mono,fontSize:27,color:C.accent});
  s.addNotes('Compare the current and target states using the same criteria.');
}
function layered() {
  const s = pptx.addSlide(); base(s, 4, '03 / Layered Architecture');
  title(s, 'Use layers when responsibility changes by boundary.', { w: 5.5, h: 1.8, fontSize: 38 });
  body(s, 'Label who owns each layer, what it exposes, and where policy is enforced.', { y: 3.05, w: 4.9, h: .8, fontSize: 16 });
  text(s, '↳ A boundary must explain a responsibility, not just draw a box.', { x:.72,y:4.28,w:4.85,h:.55,fontFace:F.mono,fontSize:11.5,color:C.ink });
  [['01','Experience','Product teams'],['02','Application services','APIs · workflows'],['03','Platform controls','Identity · policy · observability'],['04','Infrastructure','Compute · network · data']].forEach(([n,h,m],i)=>{const y=1.42+i*1.08;panel(s,6.25,y,6.05,.9,i===0);text(s,n,{x:6.5,y:y+.32,w:.45,h:.18,fontFace:F.mono,fontSize:8.5,color:C.accent});text(s,h,{x:7.15,y:y+.25,w:2.75,h:.3,fontSize:17,bold:true});text(s,m,{x:9.7,y:y+.28,w:2.25,h:.25,align:'right',fontFace:F.mono,fontSize:8.3,color:C.muted});});
  s.addNotes('Walk from the audience-facing layer down to the operating foundation and name the owner at every boundary.');
}
function flow() {
  const s = pptx.addSlide(); base(s, 5, '04 / Flow Architecture');
  title(s, 'Show what moves, who owns it, and why the next step exists.', { y: .95, h: 1.3, fontSize: 39 });
  const nodes=[['01','Source','Brief, data, code, or evidence'],['02','Argument','One coherent narrative'],['03','Action','A decision the room can make']];
  nodes.forEach(([n,h,b],i)=>{const x=.76+i*4.15;panel(s,x,3,3.25,2.45,i===1);text(s,n,{x:x+.28,y:3.32,w:.5,h:.2,fontFace:F.mono,fontSize:9,color:C.accent});text(s,h,{x:x+.28,y:4.05,w:2.6,h:.35,fontSize:22,bold:true});text(s,b,{x:x+.28,y:4.62,w:2.6,h:.65,fontSize:13.5,color:C.muted});if(i<2)text(s,'→',{x:x+3.38,y:4.02,w:.65,h:.4,align:'center',fontFace:F.mono,fontSize:24,color:C.accent});});
  s.addNotes('Replace the generic flow with the real request path, data flow, or decision model.');
}
function metric() {
  const s = pptx.addSlide(); base(s, 6, '05 / Outcome');
  shape(s,pptx.ShapeType.line,{x:.72,y:1.35,w:0,h:4.6,line:{color:C.accent,width:4}});
  text(s,'LAYOUT DIVERSITY',{x:1.08,y:1.35,w:3,h:.24,fontFace:F.mono,fontSize:9.5,bold:true,charSpacing:1.3,color:C.accent});
  text(s,'80%',{x:1.02,y:1.95,w:5.4,h:1.6,fontFace:F.display,fontSize:116,color:C.accent});
  body(s,'of a ten-slide deck should use a distinct composition before any layout repeats.',{x:1.08,y:4.05,w:5.5,h:.9,fontSize:19});
  [['≤20%','CARD-BASED PAGES'],['3–4','SLIDES BETWEEN RHYTHM CHANGES'],['1','DOMINANT IDEA PER PAGE']].forEach(([v,l],i)=>{const y=1.48+i*1.45;text(s,v,{x:7.35,y,w:1.6,h:.58,fontFace:F.display,fontSize:35});text(s,l,{x:9.02,y:y+.22,w:2.8,h:.32,fontFace:F.mono,fontSize:8.2,charSpacing:.7,color:C.muted});shape(s,pptx.ShapeType.line,{x:7.35,y:y+1.05,w:4.6,h:0,line:{color:C.border,width:1}});});
  s.addNotes('Replace these design-system metrics with verified evidence in a production deck.');
}
function evidence() {
  const s = pptx.addSlide(); base(s, 7, '06 / Evidence');
  panel(s,.72,1.35,5.25,4.9,false);text(s,'AUDIENCE RECALL / ILLUSTRATIVE',{x:1.05,y:1.68,w:3.2,h:.2,fontFace:F.mono,fontSize:8.3,charSpacing:.7,color:C.muted});
  [['Repeated',34],['Mixed',58],['Purposeful',82]].forEach(([l,v],i)=>{const y=2.55+i*.92;text(s,l,{x:1.05,y,w:1.1,h:.2,fontFace:F.mono,fontSize:8.5,color:C.muted});shape(s,pptx.ShapeType.rect,{x:2.2,y:y+.02,w:2.8,h:.16,fill:{color:C.border},line:{color:C.border}});shape(s,pptx.ShapeType.rect,{x:2.2,y:y+.02,w:2.8*v/100,h:.16,fill:{color:i===2?C.accent:C.muted},line:{color:i===2?C.accent:C.muted}});text(s,String(v),{x:5.15,y,w:.42,h:.2,align:'right',fontFace:F.mono,fontSize:9,color:C.ink});});
  text(s,'Replace illustrative data with a verified source and date.',{x:1.05,y:5.6,w:4.4,h:.28,fontFace:F.mono,fontSize:7.8,color:C.muted});
  text(s,'THE CLAIM',{x:6.65,y:1.48,w:1.8,h:.2,fontFace:F.mono,fontSize:9,bold:true,charSpacing:1.3,color:C.accent});title(s,'Evidence becomes memorable when the page gives it visual priority.',{x:6.65,y:1.9,w:5.7,h:2.3,fontSize:38});body(s,'Keep explanation adjacent, but let the chart, screenshot, quote, or example remain the anchor.',{x:6.65,y:4.65,w:5.1,h:.8,fontSize:17});
  s.addNotes('This chart is illustrative and must be replaced with verified evidence and a readable source note.');
}
function codeWalkthrough() {
  const s = pptx.addSlide(); base(s, 8, '07 / Build');
  title(s, 'Use code to prove the workflow—not to decorate the page.', { w: 5.1, h: 1.8, fontSize: 37 });
  body(s,'Crop to the lines the audience needs and pair them with the visible outcome.',{y:3.12,w:4.75,h:.8,fontSize:16});
  text(s,'↳ The command is evidence; the result is the story.',{x:.72,y:4.45,w:4.7,h:.35,fontFace:F.mono,fontSize:11.5,color:C.ink});
  shape(s,pptx.ShapeType.roundRect,{x:6.15,y:1.28,w:6.05,h:4.9,rectRadius:.06,fill:{color:C.code},line:{color:'3B3730',width:1}});shape(s,pptx.ShapeType.line,{x:6.15,y:1.83,w:6.05,h:0,line:{color:'3D3932',width:1}});text(s,'~/project',{x:6.46,y:1.5,w:2,h:.2,fontFace:F.mono,fontSize:8.5,color:'AAA197'});
  text(s,'$ codex-slides init "Architecture Review" \\\n  --format pptx \\\n  --template claude-editorial\n\n✓ 12 layout starters created\n✓ editable PPTX source generated\n✓ validation passed',{x:6.48,y:2.15,w:5.3,h:3.45,fontFace:F.mono,fontSize:13.3,color:C.codeText,valign:'top'});
  s.addNotes('Use a live command only when the demo is reliable. Keep a screenshot or recorded fallback.');
}
function comparison() {
  const s = pptx.addSlide(); base(s, 9, '08 / Trade-off');
  title(s,'Compare options on the criteria that determine the decision.',{y:.88,h:1.2,fontSize:38});
  const rows=[['CRITERION','REPEATED TEMPLATE','CONTENT-AWARE SYSTEM'],['Speed','Fast first draft','Fast with reusable archetypes'],['Clarity','One generic frame','Composition follows the message'],['Rhythm','Flat across the deck','Varied but visually consistent'],['Maintenance','Many one-off fixes','Shared layout vocabulary']];
  rows.forEach((row,r)=>{const y=2.45+r*.74;[.72,3.55,7.95].forEach((x,c)=>{const w=[2.83,4.4,4.67][c];const rec=r===3&&c===2;panel(s,x,y,w,.74,rec);text(s,row[c],{x:x+.18,y:y+.22,w:w-.36,h:.28,fontFace:r===0?F.mono:F.body,fontSize:r===0?8.5:12.5,bold:r===0||c===0||rec,charSpacing:r===0?.8:0,color:r===0?C.muted:(c===0||rec?C.ink:C.muted)});});});
  s.addNotes('Use the same criteria for both options before highlighting the recommendation.');
}
function timeline() {
  const s = pptx.addSlide(); base(s, 10, '09 / Adoption');
  title(s,'Roll out the layout system without rewriting the visual brand.',{y:.92,h:1.3,fontSize:39});
  shape(s,pptx.ShapeType.line,{x:1,y:3.45,w:11.25,h:0,line:{color:C.border,width:1.2}});
  [['01','Catalog','Name the archetypes and their jobs.'],['02','Scaffold','Ship diverse starters in every format.'],['03','Validate','Check repetition and layout coverage.'],['04','Learn','Add patterns from real presentation work.']].forEach(([n,h,b],i)=>{const x=.92+i*3.02;shape(s,pptx.ShapeType.rect,{x,y:3.13,w:.64,h:.64,fill:{color:i===1?C.accent:C.canvas},line:{color:i===1?C.accent:C.border,width:1}});text(s,n,{x,y:3.36,w:.64,h:.16,align:'center',fontFace:F.mono,fontSize:8.3,color:i===1?C.surface:C.muted});text(s,h,{x,y:4.08,w:2.5,h:.36,fontSize:19,bold:true});text(s,b,{x,y:4.64,w:2.45,h:.76,fontSize:13.5,color:C.muted});});
  s.addNotes('Mark the current phase clearly. A roadmap should show changing capability, not just dates.');
}
function risk() {
  const s = pptx.addSlide(); base(s, 11, '10 / Risk');
  title(s,'Variation without rules becomes noise.',{x:.72,y:1,w:6.3,h:1.35,fontSize:39});
  [['Low impact','Cosmetic drift',false],['High impact','Unreadable density',false],['Low probability','Export edge case',false],['High probability','Random layout choice',true]].forEach(([l,h,hot],i)=>{const x=.72+(i%2)*2.94,y=2.7+Math.floor(i/2)*1.42;panel(s,x,y,2.94,1.42,hot);text(s,l.toUpperCase(),{x:x+.22,y:y+.22,w:2.5,h:.18,fontFace:F.mono,fontSize:7.7,charSpacing:.7,color:C.muted});text(s,h,{x:x+.22,y:y+.76,w:2.46,h:.34,fontSize:15.5,bold:true});});
  [['01','Novelty over meaning','Mitigate with slide-role selection.'],['02','Too many cards','Cap card-based pages near 20%.'],['03','Theme drift','Keep shared tokens and page chrome.']].forEach(([n,h,b],i)=>{const y=1.72+i*1.38;text(s,n,{x:7.32,y,w:.42,h:.2,fontFace:F.mono,fontSize:8.8,color:C.accent});text(s,h,{x:8,y:y-.02,w:3.8,h:.34,fontSize:18,bold:true});text(s,b,{x:8,y:y+.45,w:3.8,h:.42,fontSize:13.2,color:C.muted});shape(s,pptx.ShapeType.line,{x:7.32,y:y+1.02,w:4.72,h:0,line:{color:C.border,width:1}});});
  s.addNotes('Name the mitigation and owner for real risks. The matrix should prioritize action.');
}
function closing() {
  const s = pptx.addSlide(); base(s, 12, 'The decision', true);
  title(s,'Keep the style.\nExpand the vocabulary.',{y:1.35,w:11,h:2.6,fontSize:51,color:C.codeText});
  body(s,'Choose the layout by communication purpose, then let the design system keep the deck coherent.',{y:4.35,w:9.2,h:.9,fontSize:20,color:'B9B0A5'});
  shape(s,pptx.ShapeType.rect,{x:.72,y:5.75,w:3.25,h:.58,fill:{color:C.code,transparency:100},line:{color:'4B463E',width:1}});text(s,'$  build with purpose',{x:.94,y:5.94,w:2.8,h:.18,fontFace:F.mono,fontSize:11,color:C.codeText});
  s.addNotes('Ask for one concrete action, owner, and timing. Stop after the ask.');
}

cover(); hero(); beforeAfter(); layered(); flow(); metric(); evidence(); codeWalkthrough(); comparison(); timeline(); risk(); closing();
if (LAYOUT_SEQUENCE.length !== TOTAL) throw new Error('LAYOUT_SEQUENCE must match the generated slide count.');
const outputDirectory = path.resolve(process.cwd(), 'dist');
await mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, '{{OUTPUT_FILE}}');
await pptx.writeFile({ fileName: outputPath });
console.log(`Wrote ${outputPath}`);
