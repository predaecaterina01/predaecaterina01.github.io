/* ════════════════════════════════════════════════════════════
   DECO PREDA — script.js
   Architectural Surface Atelier
   ES6+ | Vanilla JS | No libraries | Performance-first
   ════════════════════════════════════════════════════════════ */

'use strict';


/* ──────────────────────────────────────────────────────────
   UTILS
────────────────────────────────────────────────────────── */

/** Safe querySelector */
const $ = (sel, root = document) => root.querySelector(sel);

/** Safe querySelectorAll → Array */
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * t;

/** Clamp number */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);


/* ──────────────────────────────────────────────────────────
   1. LOADER
   Triple-layered dismissal — never leaves user on black
────────────────────────────────────────────────────────── */
const loaderEl = $('#loader');

/**
 * Dismiss loader once, then trigger hero reveals.
 * IIFE returns a guarded function so it fires exactly once.
 */
const dismissLoader = (() => {
  let done = false;
  return function dismiss() {
    if (done || !loaderEl) return;
    done = true;
    loaderEl.classList.add('out');
    document.body.style.overflow = '';
    // Body transitions to light after loader leaves
    setTimeout(() => document.body.classList.add('light-body'), 800);
    // Reveal hero elements with stagger
    revealHero();
  };
})();

// Lock scroll during load
document.body.style.overflow = 'hidden';

// Primary: dismiss after CSS animation (~1.3s fill) + buffer
const _primaryTimer = setTimeout(dismissLoader, 1800);

// Fast path: if load event fires before primary timer
window.addEventListener('load', () => {
  clearTimeout(_primaryTimer);
  setTimeout(dismissLoader, 400);
});

// Hard fallback: always clear after 3.5s
setTimeout(dismissLoader, 3500);


/* ──────────────────────────────────────────────────────────
   2. HERO STAGGERED REVEAL
   Called once loader exits
────────────────────────────────────────────────────────── */
function revealHero() {
  const els = $$('.reveal-hero');
  els.forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), 100 + i * 160);
  });
}


/* ──────────────────────────────────────────────────────────
   3. SCROLL PROGRESS BAR
────────────────────────────────────────────────────────── */
const progressEl = $('#progress');

function updateProgress() {
  if (!progressEl) return;
  const scrolled = window.scrollY;
  const total    = document.documentElement.scrollHeight - window.innerHeight;
  const pct      = total > 0 ? (scrolled / total) * 100 : 0;
  progressEl.style.width = pct.toFixed(2) + '%';
}


/* ──────────────────────────────────────────────────────────
   4. NAVIGATION STATE
   Dark-transparent over hero → light-solid on scroll
────────────────────────────────────────────────────────── */
const navEl    = $('#nav');
const introEl  = $('#intro');

/**
 * Determine whether the viewport midpoint is still inside
 * the dark intro section.
 */
function updateNav() {
  if (!navEl) return;

  const threshold = introEl
    ? introEl.getBoundingClientRect().bottom - window.innerHeight * 0.25
    : 0;

  if (threshold > 0) {
    navEl.classList.add('on-dark');
    navEl.classList.remove('on-light');
  } else {
    navEl.classList.remove('on-dark');
    navEl.classList.add('on-light');
  }
}

// Initialise nav class immediately (before scroll fires)
navEl && navEl.classList.add('on-dark');


/* ──────────────────────────────────────────────────────────
   5. HERO PARALLAX — breathing surface
   The CSS animation handles the scale; here we add
   a very subtle vertical shift on the scene only.
────────────────────────────────────────────────────────── */
const introScene = $('#introScene');

function updateParallax() {
  if (!introScene) return;
  const sy = window.scrollY;
  const maxShift = window.innerHeight * 0.15;
  if (sy <= window.innerHeight) {
    const shift = clamp(sy * 0.12, 0, maxShift);
    introScene.style.transform = `translateY(${shift.toFixed(2)}px)`;
  }
}


/* ──────────────────────────────────────────────────────────
   6. THROTTLED SCROLL HANDLER — single rAF
────────────────────────────────────────────────────────── */
let _scrollRAF = null;

function onScroll() {
  if (_scrollRAF) return;
  _scrollRAF = requestAnimationFrame(() => {
    updateProgress();
    updateNav();
    updateParallax();
    _scrollRAF = null;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });


/* ──────────────────────────────────────────────────────────
   7. INTERSECTION OBSERVER — section reveals
   All .reveal elements outside .intro animate in on scroll
────────────────────────────────────────────────────────── */
const revealEls = $$('.reveal').filter(el => !el.closest('.intro'));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -44px 0px' }
);

revealEls.forEach(el => revealObserver.observe(el));


/* ──────────────────────────────────────────────────────────
   8. ANIMATED COUNTERS
────────────────────────────────────────────────────────── */

/**
 * Ease-out-expo curve — architectural deceleration
 * @param {number} t 0–1
 */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Animate element from 0 to data-count value
 * @param {HTMLElement} el
 */
function animateCounter(el) {
  const target   = parseInt(el.dataset.count, 10);
  const duration = 2200; // ms
  const start    = performance.now();

  function step(now) {
    const progress = clamp((now - start) / duration, 0, 1);
    el.textContent = Math.round(easeOutExpo(progress) * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }

  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);

$$('[data-count]').forEach(el => counterObserver.observe(el));


/* ──────────────────────────────────────────────────────────
   9. CUSTOM CURSOR
   Two-part cursor: precise dot + lagging ring
────────────────────────────────────────────────────────── */
const cursorEl   = $('#cursor');
const cursorRing = cursorEl && $('.cursor__ring', cursorEl);
const cursorDot  = cursorEl && $('.cursor__dot',  cursorEl);

let cursorX = 0, cursorY = 0;
let ringX   = 0, ringY   = 0;
let _cursorRAF = null;
let cursorVisible = false;

function updateCursor() {
  // Dot: instant
  if (cursorDot) {
    cursorDot.style.left = cursorX + 'px';
    cursorDot.style.top  = cursorY + 'px';
  }

  // Ring: lerp for soft lag
  ringX = lerp(ringX, cursorX, 0.1);
  ringY = lerp(ringY, cursorY, 0.1);

  if (cursorRing) {
    cursorRing.style.left = ringX.toFixed(2) + 'px';
    cursorRing.style.top  = ringY.toFixed(2) + 'px';
  }

  _cursorRAF = requestAnimationFrame(updateCursor);
}

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;

  if (!cursorVisible && cursorEl) {
    cursorEl.style.opacity = '1';
    cursorVisible = true;
    if (!_cursorRAF) updateCursor();
  }
});

// Hover state — elements with data-cursor="link"
document.addEventListener('mouseover', (e) => {
  if (e.target.closest('[data-cursor="link"]') || e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
    cursorEl && cursorEl.classList.add('hovering');
  }
});

document.addEventListener('mouseout', (e) => {
  if (e.target.closest('[data-cursor="link"]') || e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
    cursorEl && cursorEl.classList.remove('hovering');
  }
});

// Hide cursor when leaving window
document.addEventListener('mouseleave', () => {
  if (cursorEl) cursorEl.style.opacity = '0';
});

document.addEventListener('mouseenter', () => {
  if (cursorEl) cursorEl.style.opacity = '1';
});

// Don't show custom cursor on touch devices
if ('ontouchstart' in window && cursorEl) {
  cursorEl.style.display = 'none';
  document.body.style.cursor = '';
}


/* ──────────────────────────────────────────────────────────
   10. MAGNETIC BUTTONS
   Gentle pull on elements with [data-magnetic]
────────────────────────────────────────────────────────── */
$$('[data-magnetic]').forEach(btn => {
  let rAF    = null;
  let cx = 0, cy = 0;
  let tx = 0, ty = 0;
  let active = false;
  const STRENGTH = 0.22;
  const THRESHOLD = 0.04;

  function tick() {
    cx = lerp(cx, tx, 0.09);
    cy = lerp(cy, ty, 0.09);
    btn.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;

    const settled = !active && Math.abs(cx - tx) < THRESHOLD && Math.abs(cy - ty) < THRESHOLD;
    if (settled) {
      btn.style.transform = '';
      cx = 0; cy = 0;
      rAF = null;
    } else {
      rAF = requestAnimationFrame(tick);
    }
  }

  btn.addEventListener('mouseenter', () => {
    active = true;
    if (!rAF) rAF = requestAnimationFrame(tick);
  });

  btn.addEventListener('mousemove', (e) => {
    const r  = btn.getBoundingClientRect();
    tx = (e.clientX - (r.left + r.width  / 2)) * STRENGTH;
    ty = (e.clientY - (r.top  + r.height / 2)) * STRENGTH;
  });

  btn.addEventListener('mouseleave', () => {
    active = false;
    tx = 0; ty = 0;
    if (!rAF) rAF = requestAnimationFrame(tick);
  });
});


/* ──────────────────────────────────────────────────────────
   11. MOBILE NAV
────────────────────────────────────────────────────────── */
const burgerBtn  = $('#navBurger');
const navPanelEl = $('#navPanel');

if (burgerBtn && navPanelEl) {

  burgerBtn.addEventListener('click', () => {
    const open = navPanelEl.classList.toggle('open');
    burgerBtn.setAttribute('aria-expanded', String(open));
    burgerBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navPanelEl.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on link click
  $$('a', navPanelEl).forEach(a => {
    a.addEventListener('click', () => {
      navPanelEl.classList.remove('open');
      burgerBtn.setAttribute('aria-expanded', 'false');
      burgerBtn.setAttribute('aria-label', 'Open menu');
      navPanelEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navPanelEl.classList.contains('open')) {
      navPanelEl.classList.remove('open');
      burgerBtn.setAttribute('aria-expanded', 'false');
      navPanelEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      burgerBtn.focus();
    }
  });
}


/* ──────────────────────────────────────────────────────────
   12. COMMISSION FORM — Formspree
   ─────────────────────────────────────────────────────────
   Endpoint: https://formspree.io/f/mkoqvqbw
   No SDK, no API key — plain fetch() POST.
   Emails arrive at the address set in your Formspree
   dashboard → Forms → mkoqvqbw → Settings → Email.
   ─────────────────────────────────────────────────────────
   Formspree magic fields (work automatically):
     _replyto  → sets Reply-To to the client email
     _subject  → sets email subject line
────────────────────────────────────────────────────────── */

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mkoqvqbw';

const commissionForm = $('#commissionForm');
const formOkEl       = $('#formOk');
const formErrEl      = $('#formErr');

/** Basic email format test */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());

/**
 * Toggle .f--error on the parent .f wrapper
 * @param {HTMLElement|null} input
 * @param {boolean} hasError
 */
function setError(input, hasError) {
  const wrap = input && input.closest('.f');
  if (!wrap) return;
  wrap.classList.toggle('f--error', hasError);
}

/** Show success banner, auto-hide after 9s */
function showSuccess(msg) {
  if (!formOkEl) return;
  formOkEl.textContent = msg;
  formOkEl.classList.add('show');
  setTimeout(() => {
    formOkEl.textContent = '';
    formOkEl.classList.remove('show');
  }, 9000);
}

/** Show error banner, auto-hide after 10s */
function showFormError(msg) {
  if (!formErrEl) return;
  formErrEl.textContent = msg;
  formErrEl.classList.add('show');
  setTimeout(() => {
    formErrEl.textContent = '';
    formErrEl.classList.remove('show');
  }, 10000);
}

/** Toggle submit button loading / ready state */
function setSubmitState(btn, lbl, loading) {
  if (!btn || !lbl) return;
  btn.disabled        = loading;
  lbl.textContent     = loading ? 'Sending\u2026' : 'Submit Commission';
}

if (commissionForm) {
  commissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ── Field references ──────────────────────────────────
    const nameInput   = $('#f-name',   commissionForm);
    const emailInput  = $('#f-email',  commissionForm);
    const studioInput = $('#f-studio', commissionForm);
    const typeSelect  = $('#f-type',   commissionForm);
    const briefArea   = $('#f-brief',  commissionForm);
    const submitBtn   = $('button[type="submit"]', commissionForm);
    const submitLbl   = submitBtn && $('.btn-submit__label', submitBtn);

    // ── Reset previous error states ───────────────────────
    [nameInput, emailInput, typeSelect, briefArea].forEach(f => setError(f, false));
    if (formErrEl) { formErrEl.textContent = ''; formErrEl.classList.remove('show'); }

    // ── Client-side validation ────────────────────────────
    let valid = true;
    if (!nameInput?.value.trim())    { setError(nameInput,  true); valid = false; }
    if (!isEmail(emailInput?.value)) { setError(emailInput, true); valid = false; }
    if (!typeSelect?.value)          { setError(typeSelect, true); valid = false; }
    if (!briefArea?.value.trim())    { setError(briefArea,  true); valid = false; }
    if (!valid) return;

    // ── Loading state ─────────────────────────────────────
    setSubmitState(submitBtn, submitLbl, true);

    // ── Human-readable project type ───────────────────────
    const PROJECT_LABELS = {
      private:     'Private Residence',
      commercial:  'Commercial',
      hospitality: 'Hospitality',
      developer:   'Property Developer',
      other:       'Other',
    };

    // ── Payload ───────────────────────────────────────────
    // Field names become column headers in Formspree dashboard
    // and appear in the email body.
    const payload = {
      name:         nameInput.value.trim(),
      email:        emailInput.value.trim(),
      studio:       studioInput?.value.trim() || '—',
      project_type: PROJECT_LABELS[typeSelect.value] || typeSelect.value,
      message:      briefArea.value.trim(),
      _replyto:     emailInput.value.trim(),
      _subject:     'New Commission — Deco Preda',
    };

    // ── Send to Formspree ─────────────────────────────────
    try {
      const res  = await fetch(FORMSPREE_ENDPOINT, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        // ── Success ───────────────────────────────────────
        commissionForm.reset();
        setSubmitState(submitBtn, submitLbl, false);
        showSuccess(
          'Your commission request has been received. ' +
          'The studio will respond within 24 hours.'
        );

      } else {
        // ── Formspree returned a validation error ─────────
        const errMsg = data?.errors?.map(e => e.message).join(', ')
                       || 'Submission failed. Please try again.';
        throw new Error(errMsg);
      }

    } catch (err) {
      console.error('[Deco Preda] Formspree error:', err);
      setSubmitState(submitBtn, submitLbl, false);
      showFormError(
        'Could not send message at this moment. ' +
        'Please write directly to studio@decopreda.com'
      );
    }
  });
}


/* ──────────────────────────────────────────────────────────
   13. FOOTER YEAR
────────────────────────────────────────────────────────── */
const yrEl = $('#yr');
if (yrEl) yrEl.textContent = new Date().getFullYear();


/* ──────────────────────────────────────────────────────────
   14. INIT — run synchronously on parse
   (script is placed at end of <body>)
────────────────────────────────────────────────────────── */
updateProgress();
updateNav();

/* ══════════════════════════════════════════════════════════
   PANEL INLINE CALCULATORS
   Per-material estimate drawers — Microcement / Resin / Stone
   ══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────
   TARIFF TABLE
   Base rate: 40 RON/m² standard | 35 RON/m² bulk (>150 m²)
   System multipliers apply on top of material multipliers.
────────────────────────────────────────────────────────── */
const PANEL_CALC = {

  RATE_STANDARD:  40,
  RATE_BULK:      35,
  BULK_THRESHOLD: 150,

  // Per-material labour complexity multipliers
  MATERIAL: {
    microcement: 1.00,
    resin:       1.10,
    stone:       0.95,
  },

  // System tier multipliers (coat quality / prep depth)
  SYSTEM: {
    basic:   0.85,  // single coat, minimal surface prep
    medium:  1.00,  // standard — two coats, standard prep
    premium: 1.35,  // three coats, full surface preparation
  },

  // Human-readable tier labels
  SYSTEM_LABEL: {
    basic:   'Basic coat',
    medium:  'Medium',
    premium: 'Premium',
  },
};

/** Format number as "XX.XXX RON" using Romanian locale */
function fmtRON(n) {
  return n.toLocaleString('ro-RO', { maximumFractionDigits: 0 }) + ' RON';
}

/** Ease-out cubic */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animate a number rolling up inside an element.
 * Inserts "X RON" text using fmtRON.
 * @param {HTMLElement} el
 * @param {number} target
 * @param {number} [duration=700]
 */
function rollUp(el, target, duration = 700) {
  const start = performance.now();
  function step(now) {
    const t      = Math.min((now - start) / duration, 1);
    const eased  = easeOutCubic(t);
    el.textContent = fmtRON(Math.round(eased * target));
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = fmtRON(target);
  }
  requestAnimationFrame(step);
}

/**
 * Compute estimate for a given material + sqm + system tier.
 * @returns {{ base, low, high, rate, isBulk }}
 */
function computeEstimate(material, sqm, system) {
  const isBulk = sqm > PANEL_CALC.BULK_THRESHOLD;
  const rate   = isBulk ? PANEL_CALC.RATE_BULK : PANEL_CALC.RATE_STANDARD;
  const mMult  = PANEL_CALC.MATERIAL[material] ?? 1;
  const sMult  = PANEL_CALC.SYSTEM[system]     ?? 1;
  const base   = Math.round(sqm * rate * mMult * sMult);
  const low    = Math.round(base * 0.85);
  const high   = Math.round(base * 1.40);
  return { base, low, high, rate, isBulk };
}

/**
 * Render result into a drawer's result container.
 * @param {HTMLElement} resultEl
 * @param {number} sqm
 * @param {string} material
 * @param {string} system
 */
function renderPanelResult(resultEl, sqm, material, system) {
  const { base, low, high, rate, isBulk } = computeEstimate(material, sqm, system);
  const sysLabel = PANEL_CALC.SYSTEM_LABEL[system] || system;

  resultEl.innerHTML =
    '<span class="pcalc__amount" id="pcalc-amt-' + material + '">0 RON</span>' +
    '<span class="pcalc__amount-unit">' + sqm + ' m² · ' + sysLabel + '</span>' +
    '<p class="pcalc__range">Range: ' + fmtRON(low) + ' – ' + fmtRON(high) + '</p>' +
    '<p class="pcalc__rate">' +
      rate + ' RON/m²' +
      (isBulk ? ' (bulk rate > ' + PANEL_CALC.BULK_THRESHOLD + ' m²)' : ' (standard rate)') +
    '</p>';

  const amtEl = document.getElementById('pcalc-amt-' + material);
  if (amtEl) rollUp(amtEl, base);
}

/* ──────────────────────────────────────────────────────────
   DRAWER TOGGLE
────────────────────────────────────────────────────────── */

/**
 * Open or close a single calculator drawer.
 * Closes all other open drawers first (accordion behaviour).
 * @param {HTMLButtonElement} btn
 * @param {HTMLElement} drawer
 */
function toggleDrawer(btn, drawer) {
  const isOpen = drawer.classList.contains('open');

  // Close every other open drawer
  document.querySelectorAll('.panel__calc.open').forEach(d => {
    if (d !== drawer) {
      d.classList.remove('open');
      d.setAttribute('aria-hidden', 'true');
      const b = document.querySelector('[aria-controls="' + d.id + '"]');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  });

  // Toggle current
  if (isOpen) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
  } else {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');

    // Auto-calculate if sqm already filled
    const material = drawer.dataset.material;
    const mpInput  = drawer.querySelector('.pcalc__input');
    const sysSelect = drawer.querySelector('.pcalc__select');
    if (mpInput && parseFloat(mpInput.value) > 0) {
      const resultEl = drawer.querySelector('.pcalc__result');
      if (resultEl) renderPanelResult(resultEl, parseFloat(mpInput.value), material, sysSelect.value);
    } else if (mpInput) {
      // Smooth focus after drawer opens
      setTimeout(() => mpInput.focus(), 350);
    }
  }
}

/* ──────────────────────────────────────────────────────────
   LIVE CALCULATION — triggered by input events in any drawer
────────────────────────────────────────────────────────── */

function handleDrawerInput(drawer) {
  const material  = drawer.dataset.material;
  const mpInput   = drawer.querySelector('.pcalc__input');
  const sysSelect = drawer.querySelector('.pcalc__select');
  const resultEl  = drawer.querySelector('.pcalc__result');
  if (!mpInput || !sysSelect || !resultEl) return;

  const sqm = parseFloat(mpInput.value);

  // Clear result if invalid
  if (isNaN(sqm) || sqm <= 0) {
    resultEl.innerHTML = '';
    return;
  }

  renderPanelResult(resultEl, sqm, material, sysSelect.value);
}

/* ──────────────────────────────────────────────────────────
   INIT — bind all drawer triggers and inputs
────────────────────────────────────────────────────────── */

document.querySelectorAll('.panel__estimate-btn').forEach(btn => {
  const drawerId = btn.getAttribute('aria-controls');
  const drawer   = document.getElementById(drawerId);
  if (!drawer) return;

  // Toggle on button click
  btn.addEventListener('click', () => toggleDrawer(btn, drawer));

  // Live calc on sqm input
  const mpInput = drawer.querySelector('.pcalc__input');
  if (mpInput) {
    mpInput.addEventListener('input', () => handleDrawerInput(drawer));
    mpInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleDrawerInput(drawer);
    });
  }

  // Live calc on system change
  const sysSelect = drawer.querySelector('.pcalc__select');
  if (sysSelect) {
    sysSelect.addEventListener('change', () => handleDrawerInput(drawer));
  }
});


/* ══════════════════════════════════════════════════════════
   PANEL GALLERY CAROUSELS
   Minimal — vanilla JS, no dependencies
   3 slides desktop · 2 tablet · 1 mobile
   Touch/drag support included
   ══════════════════════════════════════════════════════════ */

document.querySelectorAll('.pcarousel').forEach(carousel => {
  const id        = carousel.dataset.carousel;
  const track     = carousel.querySelector('.pcarousel__track');
  const slides    = Array.from(track.querySelectorAll('.pcarousel__slide'));
  const prevBtn   = carousel.querySelector('.pcarousel__arrow--prev');
  const nextBtn   = carousel.querySelector('.pcarousel__arrow--next');
  const dotsWrap  = document.querySelector(`.pcarousel__dots[data-dots="${id}"]`);

  if (!track || slides.length === 0) return;

  let current    = 0;
  let startX     = 0;
  let isDragging = false;

  /* ── Determine visible slides per viewport ── */
  function perView() {
    const w = window.innerWidth;
    if (w <= 900)  return 1;
    if (w <= 1200) return 2;
    return 3;
  }

  /* ── Total number of "pages" ── */
  function pages() {
    return Math.max(1, slides.length - perView() + 1);
  }

  /* ── Build dots ── */
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const n = pages();
    if (n <= 1) return;
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('button');
      dot.className = 'pcarousel__dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  /* ── Update dots active state ── */
  function updateDots() {
    if (!dotsWrap) return;
    dotsWrap.querySelectorAll('.pcarousel__dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  /* ── Move track ── */
  function goTo(index) {
    const max = pages() - 1;
    current = Math.max(0, Math.min(index, max));
    const pct  = (100 / perView()) * current;
    track.style.transform = `translateX(-${pct}%)`;
    prevBtn && (prevBtn.disabled = current === 0);
    nextBtn && (nextBtn.disabled = current >= max);
    updateDots();
  }

  /* ── Arrow clicks ── */
  prevBtn && prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn && nextBtn.addEventListener('click', () => goTo(current + 1));

  /* ── Touch / drag support ── */
  const wrap = carousel.querySelector('.pcarousel__track-wrap');
  if (wrap) {
    wrap.addEventListener('pointerdown', e => {
      startX     = e.clientX;
      isDragging = true;
      wrap.setPointerCapture(e.pointerId);
    });

    wrap.addEventListener('pointerup', e => {
      if (!isDragging) return;
      isDragging = false;
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
    });

    wrap.addEventListener('pointercancel', () => { isDragging = false; });
  }

  /* ── Keyboard navigation when focused ── */
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
  });

  /* ── Resize — recalculate ── */
  let _resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      buildDots();
      goTo(Math.min(current, pages() - 1));
    }, 200);
  });

  /* ── Init ── */
  buildDots();
  goTo(0);
});


/* ══════════════════════════════════════════════════════════
   PANEL SURFACE CAROUSELS
   Integrated into .panel__surface — opacity crossfade
   Auto-advances every 4s, pauses on hover
   ══════════════════════════════════════════════════════════ */

(function initSurfaceCarousels() {

  document.querySelectorAll('.panel__surface[data-carousel]').forEach(surface => {

    const slides   = Array.from(surface.querySelectorAll('.pcs__slide'));
    const dotsWrap = surface.querySelector('.pcs__dots');
    const btnPrev  = surface.querySelector('.pcs__arrow--prev');
    const btnNext  = surface.querySelector('.pcs__arrow--next');

    if (!slides.length) return;

    let current  = 0;
    let timer    = null;
    const DELAY  = 4000;

    /* ── Build dots ── */
    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.className = 'pcs__dot' + (i === 0 ? ' pcs__dot--active' : '');
      d.setAttribute('aria-label', `Slide ${i + 1}`);
      d.setAttribute('type', 'button');
      d.addEventListener('click', () => goTo(i));
      dotsWrap && dotsWrap.appendChild(d);
      return d;
    });

    /* ── Go to slide ── */
    function goTo(idx) {
      slides[current].classList.remove('pcs__slide--active');
      dots[current] && dots[current].classList.remove('pcs__dot--active');

      current = (idx + slides.length) % slides.length;

      slides[current].classList.add('pcs__slide--active');
      dots[current] && dots[current].classList.add('pcs__dot--active');
    }

    /* ── Auto-advance ── */
    function startAuto() {
      timer = setInterval(() => goTo(current + 1), DELAY);
    }

    function stopAuto() {
      clearInterval(timer);
    }

    /* ── Arrow buttons ── */
    btnPrev && btnPrev.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    btnNext && btnNext.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });

    /* ── Touch / swipe support ── */
    let touchStartX = 0;
    surface.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    surface.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        stopAuto();
        goTo(dx < 0 ? current + 1 : current - 1);
        startAuto();
      }
    }, { passive: true });

    /* ── Pause on hover ── */
    surface.addEventListener('mouseenter', stopAuto);
    surface.addEventListener('mouseleave', startAuto);

    /* ── Reload handler — triggered by JSON manifest loader ── */
    surface.addEventListener('carousel:reload', () => {
      stopAuto();
      // Re-collect slides after DOM update
      const newSlides = Array.from(surface.querySelectorAll('.pcs__slide'));
      if (!newSlides.length) return;
      newSlides.forEach((s, i) => {
        s.classList.toggle('pcs__slide--active', i === 0);
      });
      // Rebuild dots
      dotsWrap && (dotsWrap.innerHTML = '');
      newSlides.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'pcs__dot' + (i === 0 ? ' pcs__dot--active' : '');
        d.setAttribute('aria-label', `Slide ${i + 1}`);
        d.setAttribute('type', 'button');
        d.addEventListener('click', () => goTo(i));
        dotsWrap && dotsWrap.appendChild(d);
        dots.push(d);
      });
      current = 0;
      startAuto();
    });

    /* ── Start ── */
    startAuto();
  });

})();


/* ══════════════════════════════════════════════════════════
   JSON MANIFEST IMAGE LOADER
   Loads images.json and replaces fallback gradient slides
   with real WebP images when they exist
   ══════════════════════════════════════════════════════════ */

(async function loadImagesFromManifest() {
  try {
    const res = await fetch('images.json');
    if (!res.ok) return; // No manifest — fallback gradients remain

    const manifest = await res.json();

    // For each carousel on the page
    document.querySelectorAll('.panel__surface[data-carousel]').forEach(surface => {
      const key   = surface.dataset.carousel;
      const imgs  = manifest[key];
      if (!imgs || !imgs.length) return;

      const track = surface.querySelector('.pcs__track');
      if (!track) return;

      // Remove fallback slides
      track.querySelectorAll('.pcs__slide--fallback').forEach(s => s.remove());

      // Build real slides
      imgs.forEach((item, i) => {
        const slide = document.createElement('div');
        slide.className = 'pcs__slide' + (i === 0 ? ' pcs__slide--active' : '');

        const img = document.createElement('img');
        img.src     = item.file;
        img.alt     = item.label;
        img.loading = 'lazy';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';

        const tag = document.createElement('span');
        tag.className   = 'pcs__tag';
        tag.textContent = item.label;

        slide.appendChild(img);
        slide.appendChild(tag);
        track.appendChild(slide);
      });

      // Re-init this carousel (restart dots and auto-advance)
      // The initSurfaceCarousels already ran — trigger a custom event
      surface.dispatchEvent(new CustomEvent('carousel:reload'));
    });

  } catch (e) {
    // Manifest missing or malformed — fallback gradients remain visible
    console.info('[Deco Preda] images.json not found — using fallback gradients.');
  }
})();
