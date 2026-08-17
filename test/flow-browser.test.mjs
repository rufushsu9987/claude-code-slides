import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const browserCandidates = [
  process.env.SLIDES_BROWSER_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
  '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const browser = browserCandidates.find((candidate) => existsSync(candidate));

function windowsPath(file) {
  const match = file.match(/^\/mnt\/([a-z])\/(.*)$/i);
  if (!match) return file;
  return `${match[1].toUpperCase()}:\\${match[2].replaceAll('/', '\\')}`;
}

function browserFileUrl(file) {
  if (!browser.toLowerCase().endsWith('.exe')) return pathToFileURL(file).href;
  const match = file.match(/^\/mnt\/([a-z])\/(.*)$/i);
  if (!match) return pathToFileURL(file).href;
  const encodedPath = match[2].split('/').map(encodeURIComponent).join('/');
  return `file:///${match[1].toUpperCase()}:/${encodedPath}`;
}

function flowMarkup(count) {
  return Array.from({ length: count }, (_, index) => {
    const transition = index < count - 1
      ? `<span class="flow-transition">move ${index + 1}</span>`
      : '';
    return `<article class="flow-stop${index === 2 ? ' flow-stop--accent' : ''}"><span class="flow-index">${index + 1}</span><h3>Step ${index + 1}</h3><p>Short supporting copy.</p>${transition}</article>`;
  }).join('');
}

test('Chrome keeps four-, five-, and six-step flows aligned and clear', { skip: !browser }, async (t) => {
  const temporary = await mkdtemp(path.join(testDirectory, '.flow-browser-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const fixture = path.join(temporary, 'flow-regression.html');
  const profile = path.join(temporary, 'chrome-profile');
  const css = await readFile(new URL('../templates/html/theme.css', import.meta.url), 'utf8');
  const cases = [4, 5, 6]
    .map((count) => `<section id="case-${count}" class="slide"><header class="slide-header"><span>FLOW REGRESSION</span><span>${count} STEPS</span></header><div class="flow-title"><h2>${count}-step browser geometry.</h2><p>Every transition stays attached to adjacent markers.</p></div><div class="flow-path">${flowMarkup(count)}</div></section>`)
    .join('');

  await writeFile(
    fixture,
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="deck-shell"><main class="deck">${cases}</main></div><pre id="result"></pre><script>
      const intersects = (left, right) => left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
      const centerX = (rect) => (rect.left + rect.right) / 2;
      document.documentElement.style.setProperty('--deck-scale', String(Math.min(innerWidth / 1920, innerHeight / 1080)));
      const results = {};
      for (const count of [4, 5, 6]) {
        const slide = document.querySelector('#case-' + count);
        document.querySelectorAll('.slide').forEach((candidate) => candidate.classList.toggle('is-active', candidate === slide));
        const flow = slide.querySelector('.flow-path');
        const stops = [...flow.querySelectorAll('.flow-stop')];
        const markers = [...flow.querySelectorAll('.flow-index')];
        const labels = [...flow.querySelectorAll('.flow-transition')];
        const stopRects = stops.map((element) => element.getBoundingClientRect());
        const markerRects = markers.map((element) => element.getBoundingClientRect());
        const labelRects = labels.map((element) => element.getBoundingClientRect());
        const copyRects = [...flow.querySelectorAll('h3, p')].map((element) => element.getBoundingClientRect());
        const flowRect = flow.getBoundingClientRect();
        const slideRect = slide.getBoundingClientRect();
        const stopWidths = stopRects.map((rect) => rect.width);
        results[count] = {
          nodes: stops.length,
          transitions: labels.length,
          sameRow: Math.max(...markerRects.map((rect) => rect.top)) - Math.min(...markerRects.map((rect) => rect.top)) < 1,
          equalColumns: Math.max(...stopWidths) - Math.min(...stopWidths) < 1,
          noNodeOverlap: stopRects.slice(1).every((rect, index) => stopRects[index].right <= rect.left),
          insidePath: stopRects.every((rect) => rect.left >= flowRect.left && rect.right <= flowRect.right),
          insideSlide: [flowRect, ...stopRects, ...markerRects, ...labelRects, ...copyRects].every((rect) => rect.left >= slideRect.left && rect.right <= slideRect.right && rect.top >= slideRect.top && rect.bottom <= slideRect.bottom),
          labelsBetweenNodes: labelRects.every((rect, index) => centerX(rect) > centerX(markerRects[index]) && centerX(rect) < centerX(markerRects[index + 1])),
          labelsClearNodes: labelRects.every((label) => markerRects.every((marker) => !intersects(label, marker))),
          labelsClearCopy: labelRects.every((label) => copyRects.every((copy) => !intersects(label, copy))),
        };
      }
      document.querySelector('#result').textContent = JSON.stringify(results);
    </script></body></html>`,
  );

  const executableIsWindows = browser.toLowerCase().endsWith('.exe');
  for (const [width, height] of [[1920, 1080], [1535, 852]]) {
    const run = spawnSync(
      browser,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--no-first-run',
        '--no-default-browser-check',
        '--hide-scrollbars',
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=1000',
        `--window-size=${width},${height}`,
        `--user-data-dir=${executableIsWindows ? windowsPath(profile) : profile}`,
        '--dump-dom',
        browserFileUrl(fixture),
      ],
      { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024, timeout: 30_000 },
    );

    assert.equal(run.status, 0, run.stderr || run.error?.message);
    const serialized = run.stdout.match(/<pre id="result">([^<]+)<\/pre>/)?.[1];
    assert.ok(serialized, 'Chrome did not serialize the flow regression result.');
    const results = JSON.parse(serialized);
    for (const count of [4, 5, 6]) {
      assert.deepEqual(
        results[count],
        {
          nodes: count,
          transitions: count - 1,
          sameRow: true,
          equalColumns: true,
          noNodeOverlap: true,
          insidePath: true,
          insideSlide: true,
          labelsBetweenNodes: true,
          labelsClearNodes: true,
          labelsClearCopy: true,
        },
        `${width}x${height}, ${count}-step flow: ${JSON.stringify(results[count])}`,
      );
    }
  }
});
