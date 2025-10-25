/* ===== NAV RELEASE + STICKY + CONSISTENT SCROLL ===== */

function readPxVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

const NAV_H    = readPxVar('--nav-h', 60);
const SUBNAV_H = readPxVar('--subnav-h', 60);

const siteNav    = document.getElementById('siteNav');
const stickyBars = Array.from(document.querySelectorAll('[data-stickybar]'));

/* ---------- consistent linear smooth scroll ---------- */
function smoothScrollToLinear(targetY, duration = 700) {
  const startY   = window.scrollY || window.pageYOffset;
  const distance = targetY - startY;
  const t0       = performance.now();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || duration <= 0) {
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return;
  }

  function step(t) {
    const p = Math.min((t - t0) / duration, 1); // linear 0→1
    window.scrollTo(0, startY + distance * p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- anchor clicks with correct offset ---------- */
function getActiveStickyBar() {
  for (const el of stickyBars) {
    const r = el.getBoundingClientRect();
    if (r.top <= 0 && r.bottom > 0) return el;
  }
  return null;
}
function currentOffset() {
  if (document.body.classList.contains('released')) {
    return getActiveStickyBar() ? SUBNAV_H : 0;
  }
  return NAV_H;
}

document.querySelectorAll('[data-scroll]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const rect = target.getBoundingClientRect();
    const y = rect.top + window.pageYOffset - currentOffset() + 1;
    smoothScrollToLinear(y, 700);
  });
});

/* ---------- force main nav to release/hide ---------- */
let heroReleaseAt = Infinity;

function computeHeroRelease() {
  const hero = document.getElementById('home'); // your big image
  if (!hero) { heroReleaseAt = Infinity; return; }
  const rect = hero.getBoundingClientRect();
  const top  = window.pageYOffset + rect.top;
  heroReleaseAt = top + hero.offsetHeight - 1; // when bottom of hero passes top
}

function shouldReleaseNav() {
  const y = window.scrollY || window.pageYOffset;

  // Condition A: past the hero image bottom
  if (y >= heroReleaseAt) return true;

  // Condition B: any stickybar touching/past the top (prevents overlap)
  for (const el of stickyBars) {
    const r = el.getBoundingClientRect();
    if (r.top <= NAV_H) return true;
  }

  return false;
}

function applyReleasedState(isReleased) {
  document.body.classList.toggle('released', isReleased);
  siteNav.classList.toggle('nav--off', isReleased);
  document.documentElement.style.scrollPaddingTop = isReleased ? `${SUBNAV_H}px` : `${NAV_H}px`;
}

function onScroll() {
  applyReleasedState(shouldReleaseNav());
  updateActiveSticky();
}

/* ---------- stickybar active class (optional styling) ---------- */
function updateActiveSticky() {
  if (!document.body.classList.contains('released')) {
    stickyBars.forEach(el => el.classList.remove('stickybar--active'));
    return;
  }
  let active = null;
  stickyBars.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top <= 0 && r.bottom > 0) active = el;
  });
  stickyBars.forEach(el => el.classList.toggle('stickybar--active', el === active));
}

/* ---------- init ---------- */
function init() {
  // make sure CSS smooth scroll doesn't fight JS
  document.documentElement.style.scrollBehavior = 'auto';

  computeHeroRelease();
  onScroll();

  // recompute if the hero image loads later
  const hero = document.getElementById('home');
  if (hero && !hero.complete) {
    hero.addEventListener('load', () => { computeHeroRelease(); onScroll(); }, { once: true });
  }
}

window.addEventListener('load', init);
window.addEventListener('resize', () => { computeHeroRelease(); onScroll(); });
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- misc ---------- */
const yEl = document.getElementById('y');
if (yEl) yEl.textContent = new Date().getFullYear();