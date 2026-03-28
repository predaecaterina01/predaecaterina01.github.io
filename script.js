// @ts-nocheck
/* ════════════════════════════════════════════════════════════
   DECO PREDA — script.js
   Architectural Surface Contractor
   ES6+ | Vanilla JS | No libraries | Performance-first
   ════════════════════════════════════════════════════════════ */

'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/* ── 1. LOADER ── */
const loaderEl = $('#loader');
const dismissLoader = (() => {
  let done = false;
  return function dismiss() {
    if (done || !loaderEl) return;
    done = true;
    loaderEl.classList.add('out');
    document.body.style.overflow = '';
    setTimeout(() => document.body.classList.add('light-body'), 800);
    revealHero();
  };
})();

document.body.style.overflow = 'hidden';
const _primaryTimer = setTimeout(dismissLoader, 1800);
window.addEventListener('load', () => { clearTimeout(_primaryTimer); setTimeout(dismissLoader, 400); });
setTimeout(dismissLoader, 3500);

/* ── 2. HERO REVEAL ── */
function revealHero() {
  $$('.reveal-hero').forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), 100 + i * 160);
  });
}

/* ── 3. SCROLL PROGRESS ── */
const progressEl = $('#progress');
function updateProgress() {
  if (!progressEl) return;
  const scrolled = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  progressEl.style.width = (total > 0 ? (scrolled / total) * 100 : 0).toFixed(2) + '%';
}

/* ── 4. NAV STATE ── */
const navEl = $('#nav');
const introEl = $('#intro');
function updateNav() {
  if (!navEl) return;
  const threshold = introEl ? introEl.getBoundingClientRect().bottom - window.innerHeight * 0.25 : 0;
  if (threshold > 0) { navEl.classList.add('on-dark'); navEl.classList.remove('on-light'); }
  else { navEl.classList.remove('on-dark'); navEl.classList.add('on-light'); }
}
navEl && navEl.classList.add('on-dark');

/* ── 5. PARALLAX ── */
const introScene = $('#introScene');
function updateParallax() {
  if (!introScene) return;
  const sy = window.scrollY;
  if (sy <= window.innerHeight) {
    introScene.style.transform = `translateY(${clamp(sy * 0.12, 0, window.innerHeight * 0.15).toFixed(2)}px)`;
  }
}

/* ── 6. SCROLL HANDLER ── */
let _scrollRAF = null;
function onScroll() {
  if (_scrollRAF) return;
  _scrollRAF = requestAnimationFrame(() => { updateProgress(); updateNav(); updateParallax(); _scrollRAF = null; });
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ── 7. REVEAL OBSERVER ── */
const revealEls = $$('.reveal').filter(el => !el.closest('.intro'));
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -44px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

/* ── 8. COUNTERS ── */
function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 2200;
  const start = performance.now();
  function step(now) {
    const progress = clamp((now - start) / duration, 0, 1);
    el.textContent = Math.round(easeOutExpo(progress) * target);
    if (progress < 1) requestAnimationFrame(step); else el.textContent = target;
  }
  requestAnimationFrame(step);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) { animateCounter(entry.target); counterObserver.unobserve(entry.target); } });
}, { threshold: 0.4 });
$$('[data-count]').forEach(el => counterObserver.observe(el));

/* ── 9. CURSOR ── */
const cursorEl = $('#cursor');
const cursorRing = cursorEl && $('.cursor__ring', cursorEl);
const cursorDot = cursorEl && $('.cursor__dot', cursorEl);
let cursorX = 0, cursorY = 0, ringX = 0, ringY = 0, _cursorRAF = null, cursorVisible = false;

function updateCursor() {
  if (cursorDot) { cursorDot.style.left = cursorX + 'px'; cursorDot.style.top = cursorY + 'px'; }
  ringX = lerp(ringX, cursorX, 0.1); ringY = lerp(ringY, cursorY, 0.1);
  if (cursorRing) { cursorRing.style.left = ringX.toFixed(2) + 'px'; cursorRing.style.top = ringY.toFixed(2) + 'px'; }
  _cursorRAF = requestAnimationFrame(updateCursor);
}

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX; cursorY = e.clientY;
  if (!cursorVisible && cursorEl) { cursorEl.style.opacity = '1'; cursorVisible = true; if (!_cursorRAF) updateCursor(); }
});
document.addEventListener('mouseover', (e) => { if (e.target.closest('[data-cursor="link"]') || e.target.tagName === 'A' || e.target.tagName === 'BUTTON') cursorEl && cursorEl.classList.add('hovering'); });
document.addEventListener('mouseout', (e) => { if (e.target.closest('[data-cursor="link"]') || e.target.tagName === 'A' || e.target.tagName === 'BUTTON') cursorEl && cursorEl.classList.remove('hovering'); });
document.addEventListener('mouseleave', () => { if (cursorEl) cursorEl.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { if (cursorEl) cursorEl.style.opacity = '1'; });
if ('ontouchstart' in window && cursorEl) { cursorEl.style.display = 'none'; document.body.style.cursor = ''; }

/* ── 10. MAGNETIC BUTTONS ── */
$$('[data-magnetic]').forEach(btn => {
  let rAF = null, cx = 0, cy = 0, tx = 0, ty = 0, active = false;
  const STRENGTH = 0.22, THRESHOLD = 0.04;
  function tick() {
    cx = lerp(cx, tx, 0.09); cy = lerp(cy, ty, 0.09);
    btn.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
    const settled = !active && Math.abs(cx - tx) < THRESHOLD && Math.abs(cy - ty) < THRESHOLD;
    if (settled) { btn.style.transform = ''; cx = 0; cy = 0; rAF = null; } else rAF = requestAnimationFrame(tick);
  }
  btn.addEventListener('mouseenter', () => { active = true; if (!rAF) rAF = requestAnimationFrame(tick); });
  btn.addEventListener('mousemove', (e) => { const r = btn.getBoundingClientRect(); tx = (e.clientX - (r.left + r.width / 2)) * STRENGTH; ty = (e.clientY - (r.top + r.height / 2)) * STRENGTH; });
  btn.addEventListener('mouseleave', () => { active = false; tx = 0; ty = 0; if (!rAF) rAF = requestAnimationFrame(tick); });
});

/* ── 11. MOBILE NAV ── */
const burgerBtn = $('#navBurger');
const navPanelEl = $('#navPanel');
if (burgerBtn && navPanelEl) {
  burgerBtn.addEventListener('click', () => {
    const open = navPanelEl.classList.toggle('open');
    burgerBtn.setAttribute('aria-expanded', String(open));
    burgerBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navPanelEl.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', navPanelEl).forEach(a => {
    a.addEventListener('click', () => {
      navPanelEl.classList.remove('open');
      burgerBtn.setAttribute('aria-expanded', 'false');
      burgerBtn.setAttribute('aria-label', 'Open menu');
      navPanelEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });
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

/* ── 12. FORM ── */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mkoqvqbw';
const commissionForm = $('#commissionForm');
const formOkEl = $('#formOk');
const formErrEl = $('#formErr');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());

function setError(input, hasError) { const wrap = input && input.closest('.f'); if (wrap) wrap.classList.toggle('f--error', hasError); }
function showSuccess(msg) { if (!formOkEl) return; formOkEl.textContent = msg; formOkEl.classList.add('show'); setTimeout(() => { formOkEl.textContent = ''; formOkEl.classList.remove('show'); }, 9000); }
function showFormError(msg) { if (!formErrEl) return; formErrEl.textContent = msg; formErrEl.classList.add('show'); setTimeout(() => { formErrEl.textContent = ''; formErrEl.classList.remove('show'); }, 10000); }
function setSubmitState(btn, lbl, loading) { if (!btn || !lbl) return; btn.disabled = loading; lbl.textContent = loading ? 'Sending\u2026' : 'Submit Enquiry'; }

if (commissionForm) {
  commissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = $('#f-name', commissionForm), emailInput = $('#f-email', commissionForm);
    const studioInput = $('#f-studio', commissionForm), typeSelect = $('#f-type', commissionForm);
    const briefArea = $('#f-brief', commissionForm);
    const submitBtn = $('button[type="submit"]', commissionForm);
    const submitLbl = submitBtn && $('.btn-submit__label', submitBtn);
    [nameInput, emailInput, typeSelect, briefArea].forEach(f => setError(f, false));
    if (formErrEl) { formErrEl.textContent = ''; formErrEl.classList.remove('show'); }
    let valid = true;
    if (!nameInput?.value.trim()) { setError(nameInput, true); valid = false; }
    if (!isEmail(emailInput?.value)) { setError(emailInput, true); valid = false; }
    if (!typeSelect?.value) { setError(typeSelect, true); valid = false; }
    if (!briefArea?.value.trim()) { setError(briefArea, true); valid = false; }
    if (!valid) return;
    setSubmitState(submitBtn, submitLbl, true);
    const payload = {
      name: nameInput.value.trim(), email: emailInput.value.trim(),
      studio: studioInput?.value.trim() || '—',
      project_type: typeSelect.value, message: briefArea.value.trim(),
      _replyto: emailInput.value.trim(), _subject: 'New Commission — Deco Preda',
    };
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { commissionForm.reset(); setSubmitState(submitBtn, submitLbl, false); showSuccess('Your commission request has been received. The studio will respond within 24 hours.'); }
      else { throw new Error(data?.errors?.map(e => e.message).join(', ') || 'Submission failed.'); }
    } catch (err) { console.error('[Deco Preda] Formspree error:', err); setSubmitState(submitBtn, submitLbl, false); showFormError('Could not send message. Please write to studio@decopreda.com'); }
  });
}

/* ── 13. FOOTER YEAR ── */
const yrEl = $('#yr');
if (yrEl) yrEl.textContent = new Date().getFullYear();

/* ── 14. INIT ── */
updateProgress();
updateNav();

/* ══ CALCULATORS ══ */
const PANEL_CALC = {
  RATE: 40, BULK_THRESHOLD: 150, BULK_DISCOUNT: 0.15,
  MATERIAL: { microcement: 1.00, resin: 1.10, stone: 0.95, 'resin-design': 1.20 },
  SYSTEM: { basic: 0.85, medium: 1.00, premium: 1.35 },
  SYSTEM_LABEL: { basic: 'Basic coat', medium: 'Medium', premium: 'Premium' },
};

function fmtRON(n) { return n.toLocaleString('ro-RO', { maximumFractionDigits: 0 }) + ' RON'; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function rollUp(el, target, duration = 700) {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = fmtRON(Math.round(easeOutCubic(t) * target));
    if (t < 1) requestAnimationFrame(step); else el.textContent = fmtRON(target);
  }
  requestAnimationFrame(step);
}

function computeEstimate(material, sqm, system) {
  const mMult = PANEL_CALC.MATERIAL[material] ?? 1;
  const sMult = PANEL_CALC.SYSTEM[system] ?? 1;
  const gross = Math.round(sqm * PANEL_CALC.RATE * mMult * sMult);
  let discountPct = 0;
  if (sqm >= 200) discountPct = PANEL_CALC.BULK_DISCOUNT;
  else if (sqm > 100) discountPct = PANEL_CALC.BULK_DISCOUNT * ((sqm - 100) / 100);
  const saving = Math.round(gross * discountPct);
  const base = gross - saving;
  return { gross, base, saving, discountPct, isBulk: discountPct > 0, low: Math.round(base * 0.90), high: Math.round(base * 1.35) };
}

function renderPanelResult(resultEl, sqm, material, system) {
  const { base, saving, discountPct, isBulk, low, high } = computeEstimate(material, sqm, system);
  const sysLabel = PANEL_CALC.SYSTEM_LABEL[system] || system;
  const pctLabel = Math.round(discountPct * 100);
  let html = `<span class="pcalc__price">0 RON</span><span class="pcalc__amount-unit">${sqm} m² · ${sysLabel}</span>`;
  if (isBulk) html += `<span class="pcalc__bulk-badge">−${pctLabel}% volume discount · saving ${fmtRON(saving)}</span>`;
  html += `<p class="pcalc__range">Indicative range: ${fmtRON(low)} – ${fmtRON(high)}</p><p class="pcalc__rate">${PANEL_CALC.RATE} RON/m² base${isBulk ? ' · volume rate applied' : ''}</p>`;
  resultEl.innerHTML = html;
  const priceEl = resultEl.querySelector('.pcalc__price');
  if (priceEl) rollUp(priceEl, base);
}

function toggleDrawer(btn, drawer) {
  const isOpen = drawer.classList.contains('open');
  document.querySelectorAll('.panel__calc.open').forEach(d => {
    if (d !== drawer) { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); const b = document.querySelector('[aria-controls="' + d.id + '"]'); if (b) b.setAttribute('aria-expanded', 'false'); }
  });
  if (isOpen) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); btn.setAttribute('aria-expanded', 'false'); }
  else {
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true');
    const material = drawer.dataset.material;
    const mpInput = drawer.querySelector('.pcalc__input');
    const sysSelect = drawer.querySelector('.pcalc__select');
    if (mpInput && parseFloat(mpInput.value) > 0) { const resultEl = drawer.querySelector('.pcalc__result'); if (resultEl) renderPanelResult(resultEl, parseFloat(mpInput.value), material, sysSelect?.value); }
    else if (mpInput) setTimeout(() => mpInput.focus(), 350);
  }
}

function resetDrawer(drawer) {
  const mpInput = drawer.querySelector('.pcalc__input');
  const resultEl = drawer.querySelector('.pcalc__result');
  if (resultEl && resultEl.querySelector('.pcalc__price')) {
    resultEl.style.transition = 'opacity 0.35s ease'; resultEl.style.opacity = '0';
    setTimeout(() => {
      if (mpInput) { mpInput.value = '00'; mpInput.blur(); }
      resultEl.innerHTML = '<span class="pcalc__neutral">—</span>'; resultEl.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => { resultEl.style.transition = 'opacity 0.4s ease'; resultEl.style.opacity = '1'; }));
    }, 900);
  } else { if (mpInput) { mpInput.value = '00'; mpInput.blur(); } if (resultEl) resultEl.innerHTML = '<span class="pcalc__neutral">—</span>'; }
}

function handleDrawerInput(drawer) {
  const material = drawer.dataset.material;
  const mpInput = drawer.querySelector('.pcalc__input');
  const sysSelect = drawer.querySelector('.pcalc__select');
  const resultEl = drawer.querySelector('.pcalc__result');
  if (!mpInput || !sysSelect || !resultEl) return;
  const sqm = parseFloat(mpInput.value.trim());
  if (!mpInput.value.trim() || mpInput.value === '00' || isNaN(sqm) || sqm <= 0) { resultEl.innerHTML = '<span class="pcalc__neutral">—</span>'; return; }
  renderPanelResult(resultEl, sqm, material, sysSelect.value);
}

document.querySelectorAll('.panel__estimate-btn').forEach(btn => {
  const drawerId = btn.getAttribute('aria-controls');
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  btn.addEventListener('click', () => toggleDrawer(btn, drawer));
  const mpInput = drawer.querySelector('.pcalc__input');
  const sysSelect = drawer.querySelector('.pcalc__select');
  if (mpInput) {
    mpInput.addEventListener('input', () => handleDrawerInput(drawer));
    mpInput.addEventListener('keydown', e => { if (e.key === 'Enter') { handleDrawerInput(drawer); mpInput.blur(); } });
    mpInput.addEventListener('focus', () => { if (!mpInput.value.trim() || mpInput.value === '00' || mpInput.value === '0') mpInput.value = ''; });
    mpInput.addEventListener('blur', () => { if (!mpInput.value.trim()) { const r = drawer.querySelector('.pcalc__result'); if (r) r.innerHTML = '<span class="pcalc__neutral">—</span>'; } });
  }
  if (sysSelect) sysSelect.addEventListener('change', () => handleDrawerInput(drawer));
});

document.querySelectorAll('.panel').forEach(panel => {
  let _leaveTimer = null;
  panel.addEventListener('mouseleave', () => { const drawer = panel.querySelector('.panel__calc'); if (!drawer) return; _leaveTimer = setTimeout(() => resetDrawer(drawer), 120); });
  panel.addEventListener('mouseenter', () => clearTimeout(_leaveTimer));
});

/* ══ SURFACE CAROUSELS ══ */
(function initSurfaceCarousels() {
  document.querySelectorAll('.panel__surface[data-carousel]').forEach(surface => {
    const slides = Array.from(surface.querySelectorAll('.pcs__slide'));
    const dotsWrap = surface.querySelector('.pcs__dots');
    const btnPrev = surface.querySelector('.pcs__arrow--prev');
    const btnNext = surface.querySelector('.pcs__arrow--next');
    if (!slides.length) return;
    let current = 0, timer = null;
    const DELAY = 4000;

    if (dotsWrap) dotsWrap.innerHTML = '';
    slides.map((_, i) => {
      const d = document.createElement('button');
      d.className = 'pcs__dot' + (i === 0 ? ' pcs__dot--active' : '');
      d.setAttribute('aria-label', `Slide ${i + 1}`);
      d.setAttribute('type', 'button');
      d.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); });
      dotsWrap && dotsWrap.appendChild(d);
      return d;
    });

    function goTo(idx) {
      slides[current].classList.remove('pcs__slide--active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('pcs__slide--active');
      if (dotsWrap) dotsWrap.querySelectorAll('.pcs__dot').forEach((d, i) => d.classList.toggle('pcs__dot--active', i === current));
    }
    function startAuto() { timer = setInterval(() => goTo(current + 1), DELAY); }
    function stopAuto() { clearInterval(timer); }

    btnPrev && btnPrev.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    btnNext && btnNext.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });

    let touchStartX = 0;
    surface.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    surface.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - touchStartX; if (Math.abs(dx) > 40) { stopAuto(); goTo(dx < 0 ? current + 1 : current - 1); startAuto(); } }, { passive: true });
    surface.addEventListener('mouseenter', stopAuto);
    surface.addEventListener('mouseleave', startAuto);

    surface.addEventListener('carousel:reload', () => {
      stopAuto();
      const newSlides = Array.from(surface.querySelectorAll('.pcs__slide'));
      if (!newSlides.length) return;
      newSlides.forEach((s, i) => s.classList.toggle('pcs__slide--active', i === 0));
      if (dotsWrap) {
        dotsWrap.innerHTML = '';
        newSlides.forEach((_, i) => {
          const d = document.createElement('button');
          d.className = 'pcs__dot' + (i === 0 ? ' pcs__dot--active' : '');
          d.setAttribute('aria-label', `Slide ${i + 1}`);
          d.setAttribute('type', 'button');
          d.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); });
          dotsWrap.appendChild(d);
        });
      }
      current = 0; startAuto();
    });
    startAuto();
  });
})();

/* ══ IMAGE MANIFEST LOADER ══ */
(async function loadImagesFromManifest() {
  try {
    const res = await fetch('images.json');
    if (!res.ok) return;
    const manifest = await res.json();
    document.querySelectorAll('.panel__surface[data-carousel]').forEach(surface => {
      const imgs = manifest[surface.dataset.carousel];
      if (!imgs || !imgs.length) return;
      const track = surface.querySelector('.pcs__track');
      if (!track) return;
      track.querySelectorAll('.pcs__slide').forEach(s => s.remove());
      imgs.forEach((item, i) => {
        const slide = document.createElement('div');
        slide.className = 'pcs__slide' + (i === 0 ? ' pcs__slide--active' : '');
        const img = document.createElement('img');
        img.src = item.file; img.alt = item.label; img.loading = 'lazy';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
        const tag = document.createElement('span');
        tag.className = 'pcs__tag'; tag.textContent = item.label;
        slide.appendChild(img); slide.appendChild(tag); track.appendChild(slide);
      });
      surface.dispatchEvent(new CustomEvent('carousel:reload'));
    });
  } catch (e) { console.info('[Deco Preda] images.json not found — using fallback gradients.'); }
})();

/* ══ SYSTEMS FILTER — Seal version ══ */
(function initSystemsFilter() {
  const panels     = Array.from(document.querySelectorAll('.panel[data-domain]'));
  const moreWrap   = document.getElementById('systemsMore');
  const heading    = document.getElementById('systemsSubline');
  const btnInd     = document.getElementById('btnIndustrial');
  const btnArch    = document.getElementById('btnArchitectural');
  const panelsGrid = document.querySelector('.systems__panels');

  if (!panels.length) return;

  const COPY = {
    industrial: {
      subline:        '2 systems specified for your environment.',
      sealText:       'View Architectural\n& Living Systems',
      mobileMoreText: '+ 2 more systems',
    },
    architectural: {
      subline:        'Infinite application.',
      sealText:       'View Industrial\n& Logistics Systems',
      mobileMoreText: '+ 2 more systems',
    },
  };

  // Elementele create dinamic
  let sealEl       = null;
  let dividerEl    = null;
  let mobileMoreEl = null;

  function cleanup() {
    if (sealEl)       { sealEl.remove();       sealEl = null; }
    if (dividerEl)    { dividerEl.remove();    dividerEl = null; }
    if (mobileMoreEl) { mobileMoreEl.remove(); mobileMoreEl = null; }
  }

  function revealVeiled() {
    // Dezvoalez toate panelurile
    panels.forEach(panel => {
      panel.classList.remove('is-veiled');
      panel.classList.add('is-revealed');
    });

    // Ascund sigiliul si elementele auxiliare
    if (sealEl)       sealEl.classList.add('is-hidden');
    if (dividerEl)    dividerEl.classList.add('is-hidden');
    if (mobileMoreEl) mobileMoreEl.classList.add('is-hidden');

    // Reset grid
    if (panelsGrid) panelsGrid.classList.remove('filtered-2', 'filtered-3');
  }

  function filterByDomain(domain) {
    // Curata elementele anterioare
    cleanup();

    // Reset toate panelurile
    panels.forEach(panel => {
      panel.classList.remove('is-hidden', 'is-veiled', 'is-revealed');
      panel.style.display = '';
    });

    // Update heading
    if (heading) heading.innerHTML = COPY[domain].subline;

    // Ascunde More accordion
    if (moreWrap) moreWrap.style.display = 'none';

    // Clasifica panelurile
    const secondary = [];
    let firstSecondary = null;

    panels.forEach(panel => {
      const pd = panel.dataset.domain;
      const isPrimary = pd === 'both' || pd === domain;
      if (!isPrimary) {
        panel.classList.add('is-veiled');
        secondary.push(panel);
        if (!firstSecondary) firstSecondary = panel;
      }
    });
    // Reordonează DOM: primare primele, voalate ultimele
panels.forEach(panel => {
  if (!panel.classList.contains('is-veiled')) {
    panelsGrid.insertBefore(panel, panelsGrid.firstChild);
  }
});
panels.forEach(panel => {
  if (panel.classList.contains('is-veiled')) {
    panelsGrid.appendChild(panel);
  }
});

    if (!secondary.length || !panelsGrid) return;

    // ── Divider simplu inainte de zona voalata ──
    dividerEl = document.createElement('div');
    dividerEl.className = 'systems__veil-divider';
    firstSecondary = panelsGrid.querySelector('.panel.is-veiled');

    // ── Calculeaza pozitia si dimensiunea zonei voalate ──
    // Sigiliul se pozitioneaza absolut peste panelurile voalate
    // Folosim un wrapper relativ in jurul intregului grid

    // ── Sigiliu desktop ──
    sealEl = document.createElement('div');
    sealEl.className = 'systems__seal';

    const copy     = COPY[domain];
    const lines    = copy.sealText.split('\n');

   sealEl.innerHTML = `
  <button class="systems__seal-btn" type="button">
    <span>${copy.sealText.replace('\n', ' ')}</span>
    <span class="systems__seal-icon" aria-hidden="true">→</span>
  </button>
`;

    // Inseram sigiliul DUPA primul panou voalat
    // si il pozitionam cu JS dupa render
    document.querySelector('.systems').appendChild(sealEl);

    sealEl.querySelector('.systems__seal-btn')
      .addEventListener('click', revealVeiled);

    // Pozitionare dinamica dupa render
    requestAnimationFrame(() => {
      positionSeal();
    });

    // ── Buton mobil ──
    mobileMoreEl = document.createElement('div');
    mobileMoreEl.className = 'systems__mobile-more';
    mobileMoreEl.innerHTML = `
      <button class="systems__mobile-more-btn" type="button">
        <span>${copy.mobileMoreText}</span>
        <span aria-hidden="true">↓</span>
      </button>
    `;
    panelsGrid.insertBefore(mobileMoreEl, firstSecondary);

    mobileMoreEl.querySelector('.systems__mobile-more-btn')
      .addEventListener('click', () => {
        // Pe mobile — arata panelurile ascunse
        secondary.forEach(p => {
          p.style.display = '';
          p.classList.remove('is-veiled');
          p.classList.add('is-revealed');
        });
        mobileMoreEl.classList.add('is-hidden');
        dividerEl && dividerEl.classList.add('is-hidden');
      });
  }

  function positionSeal() {
    if (!sealEl) return;

    const veiledPanels = panels.filter(p => p.classList.contains('is-veiled'));
    if (!veiledPanels.length) return;

    const gridRect  = panelsGrid.getBoundingClientRect();
    const first     = veiledPanels[0].getBoundingClientRect();
    const last      = veiledPanels[veiledPanels.length - 1].getBoundingClientRect();

    // Zona voalata relativa la .systems section
    const sysEl     = document.querySelector('.systems');
    const sysRect   = sysEl.getBoundingClientRect();

    const zoneLeft   = first.left  - sysRect.left;
    const zoneTop    = first.top   - sysRect.top  + window.scrollY;
    const zoneWidth  = last.right  - first.left;
    const zoneHeight = last.bottom - first.top;

    sealEl.style.position = 'absolute';
    sealEl.style.left     = (zoneLeft + zoneWidth  / 2) + 'px';
    sealEl.style.top = (zoneTop + zoneHeight * 0.65) + 'px';
    sealEl.style.transform = 'translate(-50%, -50%)';
    sealEl.style.zIndex   = '10';
  }

  // Re-pozitionare la resize
  window.addEventListener('resize', () => {
    if (sealEl && !sealEl.classList.contains('is-hidden')) {
      requestAnimationFrame(positionSeal);
    }
  });

  // Scroll — re-pozitionare nu e necesara (position e relativa la .systems)

  if (btnInd) {
    btnInd.addEventListener('click', (e) => {
      e.preventDefault();
      filterByDomain('industrial');
      document.getElementById('systems').scrollIntoView({ behavior: 'smooth' });
      // Re-pozitioneaza dupa scroll
      setTimeout(positionSeal, 600);
    });
  }

  if (btnArch) {
    btnArch.addEventListener('click', (e) => {
      e.preventDefault();
      filterByDomain('architectural');
      document.getElementById('systems').scrollIntoView({ behavior: 'smooth' });
      setTimeout(positionSeal, 600);
    });
  }

})();
