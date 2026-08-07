const deck = document.querySelector('#deck');
const slides = [...document.querySelectorAll('.slide')];
const progressBar = document.querySelector('#progressBar');
const pageCounter = document.querySelector('#pageCounter');
const notesPanel = document.querySelector('#notesPanel');
const notesContent = document.querySelector('#notesContent');
const closeNotes = document.querySelector('#closeNotes');

let current = clamp(Number.parseInt(location.hash.slice(1), 10) - 1 || 0, 0, slides.length - 1);
let touchStartX = null;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function scaleDeck() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.documentElement.style.setProperty('--deck-scale', String(scale));
}

function render({ updateHash = true } = {}) {
  slides.forEach((slide, index) => {
    const active = index === current;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', active ? 'false' : 'true');
  });

  const page = current + 1;
  progressBar.style.width = `${(page / slides.length) * 100}%`;
  pageCounter.textContent = `${page} / ${slides.length}`;
  document.title = `${slides[current].dataset.title || `Slide ${page}`} — {{TITLE}}`;

  const notes = slides[current].querySelector('.notes')?.textContent.trim() || 'No speaker notes for this slide.';
  notesContent.textContent = notes;

  if (updateHash) history.replaceState(null, '', `#${page}`);
}

function goTo(index) {
  current = clamp(index, 0, slides.length - 1);
  render();
}

function toggleNotes(force) {
  const shouldOpen = force ?? notesPanel.hidden;
  notesPanel.hidden = !shouldOpen;
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
}

window.addEventListener('resize', scaleDeck);
window.addEventListener('hashchange', () => {
  const requested = Number.parseInt(location.hash.slice(1), 10) - 1;
  if (Number.isFinite(requested)) {
    current = clamp(requested, 0, slides.length - 1);
    render({ updateHash: false });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
    event.preventDefault();
    goTo(current + 1);
  } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    goTo(current - 1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    goTo(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    goTo(slides.length - 1);
  } else if (event.key.toLowerCase() === 'f') {
    event.preventDefault();
    toggleFullscreen();
  } else if (event.key.toLowerCase() === 'n') {
    event.preventDefault();
    toggleNotes();
  } else if (event.key.toLowerCase() === 'p') {
    event.preventDefault();
    window.print();
  } else if (event.key === 'Escape') {
    toggleNotes(false);
  }
});

deck.addEventListener('click', (event) => {
  if (event.target.closest('a, button')) return;
  if (event.clientX < window.innerWidth * 0.28) goTo(current - 1);
  else goTo(current + 1);
});

deck.addEventListener(
  'touchstart',
  (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
  },
  { passive: true },
);

deck.addEventListener(
  'touchend',
  (event) => {
    if (touchStartX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    if (Math.abs(delta) > 60) goTo(current + (delta < 0 ? 1 : -1));
    touchStartX = null;
  },
  { passive: true },
);

closeNotes.addEventListener('click', () => toggleNotes(false));

scaleDeck();
render();
