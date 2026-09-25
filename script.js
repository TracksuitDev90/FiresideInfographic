/* Fireside Infograph: ratings, form, tools dock, persistence and export.
 * Colours and theme state come from theme.js (window.Fireside). */
(function () {
  'use strict';

  const F = window.Fireside;
  const C = F.color;
  const $ = (sel, root = document) => root.querySelector(sel);

  // === CONTENT ===
  const CATEGORIES = [
    ['Intelligence', 'How smart are you compared to the average person?'],
    ['Wealth', 'How wealthy are you compared to the average person?'],
    ['Sex Life', 'How’s your sex life compared to the average person?'],
    ['Physical Appearance', 'How attractive are you compared to the average person?'],
    ['Personality', 'How likeable is your personality compared to the average person?'],
    ['Confidence', 'How confident are you compared to the average person?'],
    ['Social Life', 'How active is your social life compared to the average person?'],
    ['Health / Fitness', 'How healthy and fit are you compared to the average person?'],
    ['Happiness', 'How happy are you compared to the average person?'],
    ['Cringiness', 'How cringey are you compared to the average person?']
  ];
  const BOXES = 9;   // regular boxes per row
  const MAX = 10;    // the ★ bonus box makes 10/10
  const AGES = Array.from({ length: 82 }, (_, i) => String(18 + i));
  const MBTI = ['Unknown', 'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
                'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
  const FIELDS = [
    { id: 'f-name', key: 'name', label: 'name' },
    { id: 'f-gender', key: 'gender', label: 'gender' },
    { id: 'f-orientation', key: 'orientation', label: 'orientation' },
    { id: 'f-age', key: 'age', label: 'age' },
    { id: 'f-type', key: 'type', label: 'personality type' }
  ];
  const INFO_ICON = '<svg class="icon info-icon" viewBox="0 0 24 24" aria-hidden="true" data-html2canvas-ignore><path d="m6 9 6 6 6-6"/></svg>';

  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isHex = v => typeof v === 'string' && /^#[0-9A-F]{6}$/i.test(v);
  const clampInt = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(v)) || 0));

  // === STATE (restored from localStorage via theme.js) ===
  const saved = F.state;
  let currentColor = isHex(saved.color) ? saved.color.toUpperCase() : F.defaultFill();
  const rows = CATEGORIES.map((_, i) => {
    const r = (Array.isArray(saved.rows) && saved.rows[i]) || {};
    return { value: clampInt(r.v, 0, MAX), color: isHex(r.c) ? r.c.toUpperCase() : null, el: null, boxes: [], star: null };
  });

  let persistTimer = null;
  function persistNow() {
    clearTimeout(persistTimer);
    saved.color = currentColor;
    saved.rows = rows.map(r => ({ v: r.value, c: r.color }));
    saved.fields = {};
    FIELDS.forEach(f => { saved.fields[f.key] = $('#' + f.id).value; });
    F.persist();
  }
  function persist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistNow, 200);
  }
  window.addEventListener('pagehide', persistNow);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persistNow(); });

  // === SMALL HELPERS ===
  function haptic() {
    if (navigator.vibrate && !reducedMotion.matches) {
      try { navigator.vibrate(6); } catch (e) { /* not allowed right now */ }
    }
  }

  const toastsEl = $('#toasts');
  function toast(message, opts = {}) {
    const el = document.createElement('div');
    el.className = 'toast';
    const text = document.createElement('span');
    text.textContent = message;
    el.appendChild(text);
    let timer = null;
    const dismiss = () => {
      clearTimeout(timer);
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 220);
    };
    if (opts.action) {
      el.classList.add('has-action');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opts.action;
      btn.addEventListener('click', () => { opts.onAction(); dismiss(); });
      el.appendChild(btn);
    }
    toastsEl.appendChild(el);
    while (toastsEl.children.length > 2) toastsEl.firstElementChild.remove();
    timer = setTimeout(dismiss, opts.duration || 3200);
    return dismiss;
  }

  // === FORM ===
  function fillSelect(select, values) {
    const frag = document.createDocumentFragment();
    values.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      frag.appendChild(o);
    });
    select.appendChild(frag);
  }
  fillSelect($('#f-age'), AGES);
  fillSelect($('#f-type'), MBTI);

  const fieldEls = FIELDS.map(f => $('#' + f.id));
  const saveBtn = $('#save-button');

  const missingFields = () => FIELDS.filter((f, i) => !fieldEls[i].value.trim());

  function updateSaveState() {
    const ready = missingFields().length === 0;
    saveBtn.classList.toggle('is-ready', ready);
    if (ready) warmExporter();
  }

  FIELDS.forEach((f, i) => {
    const el = fieldEls[i];
    const stored = saved.fields && saved.fields[f.key];
    if (typeof stored === 'string') {
      if (el.tagName === 'SELECT') {
        if (Array.from(el.options).some(o => o.value === stored && stored)) el.value = stored;
      } else {
        el.value = stored.slice(0, el.maxLength > 0 ? el.maxLength : 64);
      }
    }
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      el.closest('.field').classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
      updateSaveState();
      persist();
    });
    // "Next" on the phone keyboard moves through the form
    if (el.tagName === 'INPUT') {
      el.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const next = fieldEls[i + 1];
        if (next) next.focus(); else el.blur();
      });
    }
  });

  function listToText(items) {
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  function flagMissing(missing) {
    missing.forEach(f => {
      const el = $('#' + f.id);
      const field = el.closest('.field');
      field.classList.remove('is-invalid');
      void field.offsetWidth; // restart the shake
      field.classList.add('is-invalid');
      el.setAttribute('aria-invalid', 'true');
    });
    const first = $('#' + missing[0].id);
    first.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
    // Selects open a picker on focus on some phones, so only focus text fields
    if (first.tagName === 'INPUT') first.focus({ preventScroll: true });
    toast(`Add your ${listToText(missing.map(f => f.label))} to save`);
  }

  // Typing on a phone: tuck the dock away so it doesn't ride on the keyboard
  document.addEventListener('focusin', e => {
    if (coarsePointer.matches && e.target.matches && e.target.matches('input.input')) {
      document.documentElement.classList.add('is-typing');
    }
  });
  document.addEventListener('focusout', e => {
    if (e.target.matches && e.target.matches('input.input')) {
      document.documentElement.classList.remove('is-typing');
    }
  });

  // === RATINGS ===
  const ratingsEl = $('#ratings');

  CATEGORIES.forEach(([name, desc], i) => {
    const wrap = document.createElement('div');
    wrap.className = 'rating';
    wrap.innerHTML =
      `<h2 class="rating-title"><button type="button" class="rating-name" id="cat-${i}" aria-expanded="false" aria-controls="desc-${i}">${name}${INFO_ICON}</button></h2>` +
      `<div class="rating-desc-wrap" id="desc-${i}"><div><p class="rating-desc" id="desc-text-${i}">${desc}</p></div></div>` +
      `<div class="boxes" role="slider" tabindex="0" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="${MAX}" aria-labelledby="cat-${i}" aria-describedby="desc-text-${i}">` +
      '<span class="box"></span>'.repeat(BOXES) + '<span class="box star"></span></div>';
    ratingsEl.appendChild(wrap);

    const row = rows[i];
    row.el = wrap.querySelector('.boxes');
    row.boxes = Array.from(row.el.querySelectorAll('.box:not(.star)'));
    row.star = row.el.querySelector('.star');
    row.boxes.concat(row.star).forEach(b => b.addEventListener('animationend', () => b.classList.remove('pop')));
    row.el.addEventListener('animationend', e => { if (e.pseudoElement) row.el.classList.remove('celebrate'); });

    const toggle = wrap.querySelector('.rating-name');
    toggle.addEventListener('click', () => {
      const open = wrap.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    attachPointer(row);
    attachKeyboard(row);
    renderRow(row);
  });

  function pop(box, color) {
    box.style.setProperty('--pulse', C.rgba(color, 0.55));
    box.classList.remove('pop');
    void box.offsetWidth; // restart the animation
    box.classList.add('pop');
  }

  function renderRow(row, animate) {
    const color = row.color || currentColor;
    const filled = Math.min(row.value, BOXES);
    row.boxes.forEach((box, j) => {
      const on = j < filled;
      const was = box.classList.contains('filled');
      box.classList.remove('is-preview');
      if (on) {
        const c = C.ramp(color, j, BOXES);
        box.style.backgroundColor = c;
        if (!was) {
          box.classList.add('filled');
          if (animate) pop(box, c);
        }
      } else if (was) {
        box.classList.remove('filled');
        box.style.backgroundColor = '';
      }
    });

    const maxed = row.value === MAX;
    const wasMaxed = row.star.classList.contains('maxed');
    row.star.classList.toggle('maxed', maxed);
    row.el.classList.toggle('is-max', maxed);
    if (maxed) {
      const deep = C.ramp(color, BOXES - 1, BOXES);
      row.star.style.backgroundColor = deep;
      row.star.style.setProperty('--star-ink', C.bestInk(deep));
      if (!wasMaxed && animate) {
        pop(row.star, '#F5C542');
        row.el.classList.remove('celebrate');
        void row.el.offsetWidth;
        row.el.classList.add('celebrate');
      }
    } else {
      row.star.style.backgroundColor = '';
    }

    row.el.setAttribute('aria-valuenow', String(row.value));
    row.el.setAttribute('aria-valuetext', maxed ? '10 out of 10, maxed' : `${row.value} out of 10`);
  }

  // Set a row's value. Any change also paints the row in the current colour,
  // so re-tapping a row is how you recolour it.
  function setValue(row, value, opts = {}) {
    value = clampInt(value, 0, MAX);
    const recolour = value > 0 && row.color !== currentColor;
    if (value === row.value && !recolour) return;
    if (value > 0) row.color = currentColor;
    row.value = value;
    renderRow(row, true);
    if (opts.haptic) haptic();
    persist();
  }

  // Midpoints between neighbouring cells, measured once per gesture.
  function measure(row) {
    const rects = row.boxes.concat(row.star).map(el => el.getBoundingClientRect());
    const mids = [];
    for (let k = 0; k < rects.length - 1; k++) mids.push((rects[k].right + rects[k + 1].left) / 2);
    return { left: rects[0].left, mids };
  }
  // Value (1–10) under clientX; while dragging, going left of the first box gives 0.
  function valueAt(m, x, allowZero) {
    if (allowZero && x < m.left) return 0;
    let k = 0;
    while (k < m.mids.length && x >= m.mids[k]) k++;
    return k + 1;
  }

  function clearPreview(row) {
    row.boxes.forEach(b => b.classList.remove('is-preview'));
  }
  function showPreview(row, x) {
    const target = Math.min(valueAt(measure(row), x, false), BOXES);
    row.el.style.setProperty('--preview', C.rgba(currentColor, 0.38));
    row.boxes.forEach((b, j) => b.classList.toggle('is-preview', j >= row.value && j < target));
  }

  function attachPointer(row) {
    const el = row.el;
    let g = null; // current gesture

    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || g) return;
      g = { id: e.pointerId, type: e.pointerType, x0: e.clientX, y0: e.clientY, start: row.value, m: measure(row), dragging: false };
      if (e.pointerType === 'mouse') {
        e.preventDefault();
        el.focus({ preventScroll: true });
        el.setPointerCapture(e.pointerId);
      }
      // Touch: do nothing yet. A vertical swipe must stay a page scroll
      // (touch-action: pan-y), so we only fill once the finger moves sideways
      // or lifts as a tap.
    });

    el.addEventListener('pointermove', e => {
      if (!g) {
        if (e.pointerType === 'mouse') showPreview(row, e.clientX);
        return;
      }
      if (e.pointerId !== g.id) return;
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      if (!g.dragging) {
        const slop = g.type === 'mouse' ? 3 : 8;
        if (Math.abs(dx) < slop || Math.abs(dx) < Math.abs(dy)) return;
        g.dragging = true;
        if (g.type !== 'mouse') {
          try { el.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
        }
      }
      setValue(row, valueAt(g.m, e.clientX, true), { haptic: g.type === 'touch' });
    });

    el.addEventListener('pointerup', e => {
      if (!g || e.pointerId !== g.id) return;
      const moved = Math.hypot(e.clientX - g.x0, e.clientY - g.y0);
      if (!g.dragging && moved < 12) {
        // Tap: fill up to this box. Tapping the current value clears the row;
        // tapping a lit ★ drops back to 9.
        const hit = valueAt(g.m, e.clientX, false);
        const next = hit === g.start ? (hit === MAX ? BOXES : 0) : hit;
        setValue(row, next, { haptic: g.type === 'touch' });
      }
      g = null;
      if (e.pointerType === 'mouse') showPreview(row, e.clientX);
    });

    el.addEventListener('pointercancel', e => {
      if (!g || e.pointerId !== g.id) return;
      // The browser took over (usually a scroll): undo any partial drag.
      if (g.dragging) setValue(row, g.start);
      g = null;
    });

    el.addEventListener('pointerleave', e => {
      if (e.pointerType === 'mouse') clearPreview(row);
    });
  }

  function attachKeyboard(row) {
    row.el.addEventListener('keydown', e => {
      let next = null;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowUp': next = row.value + 1; break;
        case 'ArrowLeft': case 'ArrowDown': next = row.value - 1; break;
        case 'PageUp': next = row.value + 3; break;
        case 'PageDown': next = row.value - 3; break;
        case 'Home': next = 0; break;
        case 'End': next = MAX; break;
        default:
          if (/^[0-9]$/.test(e.key)) next = Number(e.key);
      }
      if (next === null) return;
      e.preventDefault();
      setValue(row, next);
    });
  }

  // === TOOLS DOCK ===
  const colorBtn = $('#color-button');
  const colorDot = $('#color-dot');
  const popover = $('#color-popover');
  const swatchesEl = $('#swatches');
  const clearBtn = $('#clear-button');
  const themeBtn = $('#theme-button');
  const darkBtn = $('#dark-toggle');
  const themeNameEl = $('#theme-name');
  let customInput = null;

  function updateColorUI() {
    colorDot.style.setProperty('--fill', currentColor);
    swatchesEl.querySelectorAll('.swatch').forEach(s => {
      s.setAttribute('aria-pressed', String(s.dataset.hex === currentColor));
    });
    if (customInput) customInput.parentElement.style.setProperty('--c', currentColor);
  }

  function setColor(hex) {
    currentColor = hex.toUpperCase();
    updateColorUI();
    persist();
  }

  function buildSwatches() {
    swatchesEl.textContent = '';
    F.swatches().forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.dataset.hex = s.hex.toUpperCase();
      b.style.setProperty('--c', s.hex);
      b.setAttribute('aria-label', s.name);
      b.title = s.name;
      b.addEventListener('click', () => { setColor(s.hex); closePopover(true); });
      swatchesEl.appendChild(b);
    });
    const custom = document.createElement('label');
    custom.className = 'swatch swatch-custom';
    custom.title = 'Custom color';
    customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.value = currentColor.toLowerCase();
    customInput.setAttribute('aria-label', 'Custom color');
    customInput.addEventListener('input', () => setColor(customInput.value));
    customInput.addEventListener('change', () => { setColor(customInput.value); closePopover(true); });
    custom.appendChild(customInput);
    swatchesEl.appendChild(custom);
    updateColorUI();
  }

  function onOutsidePointer(e) {
    if (!popover.contains(e.target) && !colorBtn.contains(e.target)) closePopover(false);
  }
  function onPopoverKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closePopover(true); }
  }
  function openPopover() {
    popover.hidden = false;
    colorBtn.setAttribute('aria-expanded', 'true');
    const current = swatchesEl.querySelector('.swatch[aria-pressed="true"]') || swatchesEl.querySelector('.swatch');
    if (current) current.focus({ preventScroll: true });
    document.addEventListener('pointerdown', onOutsidePointer, true);
    document.addEventListener('keydown', onPopoverKey);
  }
  function closePopover(returnFocus) {
    if (popover.hidden) return;
    popover.hidden = true;
    colorBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutsidePointer, true);
    document.removeEventListener('keydown', onPopoverKey);
    if (returnFocus) colorBtn.focus({ preventScroll: true });
  }
  colorBtn.addEventListener('click', () => (popover.hidden ? openPopover() : closePopover(true)));

  clearBtn.addEventListener('click', () => {
    const before = rows.map(r => ({ value: r.value, color: r.color }));
    if (before.every(r => r.value === 0)) {
      toast('Nothing to clear yet');
      return;
    }
    rows.forEach(r => { r.value = 0; renderRow(r); });
    persistNow();
    toast('Ratings cleared', {
      action: 'Undo',
      duration: 6000,
      onAction: () => {
        rows.forEach((r, i) => { r.value = before[i].value; r.color = before[i].color; renderRow(r); });
        persistNow();
      }
    });
  });

  function updateThemeName() {
    themeNameEl.textContent = F.themeName();
  }

  themeBtn.addEventListener('click', () => {
    const oldDefault = F.defaultFill();
    F.shuffleTheme();
    const newDefault = F.defaultFill();
    // Rows (and the brush) still on the old theme's default follow the new one
    rows.forEach(r => { if (r.color === oldDefault) r.color = newDefault; });
    if (currentColor === oldDefault) currentColor = newDefault;
    rows.forEach(r => renderRow(r));
    buildSwatches();
    updateThemeName();
    persistNow();
    toast(`Theme: ${F.themeName()}`);
  });

  function syncDarkButton() { darkBtn.setAttribute('aria-pressed', String(F.dark)); }
  darkBtn.addEventListener('click', () => F.setDark(!F.dark));
  F.onDarkChange(syncDarkButton);

  // === SAVE / EXPORT ===
  let exporterPromise = null;
  function loadExporter() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (!exporterPromise) {
      exporterPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'vendor/html2canvas.min.js';
        s.async = true;
        s.onload = () => (window.html2canvas ? resolve(window.html2canvas) : reject(new Error('html2canvas missing')));
        s.onerror = () => { s.remove(); reject(new Error('Could not load html2canvas')); };
        document.head.appendChild(s);
      }).catch(err => {
        exporterPromise = null; // allow a retry
        throw err;
      });
    }
    return exporterPromise;
  }
  // Fetch the (large) image library only once someone is close to saving.
  let warmed = false;
  function warmExporter() {
    if (warmed) return;
    warmed = true;
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
    idle(() => loadExporter().catch(() => { warmed = false; }));
  }

  function fontsReady(ms) {
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return Promise.race([ready, new Promise(resolve => setTimeout(resolve, ms))]);
  }

  async function renderImage() {
    const [html2canvas] = await Promise.all([loadExporter(), fontsReady(2500)]);
    // html2canvas copies pseudo-elements from the live page, so end any
    // 10/10 shimmer first or it gets frozen mid-sweep in the image.
    rows.forEach(r => r.el.classList.remove('celebrate'));
    const node = $('#infograph');
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: F.palette.page,
      windowWidth: 1200,
      windowHeight: 900,
      logging: false,
      ignoreElements: el => el.id === 'dock' || el.id === 'toasts' || el.tagName === 'DIALOG',
      onclone: doc => {
        doc.documentElement.classList.add('exporting');
        const meta = doc.getElementById('export-meta');
        if (meta) meta.textContent = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
    });
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Image encoding failed'))), 'image/png');
    });
  }

  function fileName() {
    const slug = $('#f-name').value
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
    return slug ? `fireside-infograph-${slug}.png` : 'fireside-infograph.png';
  }

  function download(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  // Touch devices get a preview with Share (→ Photos, Discord…) and Download.
  // Share needs a fresh tap, which is why it isn't triggered automatically.
  const dialog = $('#preview');
  const previewImg = $('#preview-img');
  const shareBtn = $('#preview-share');
  const downloadLink = $('#preview-download');
  $('#preview-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  function openPreview(file) {
    if (typeof dialog.showModal !== 'function') { download(file); return; }
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    downloadLink.href = url;
    downloadLink.download = file.name;
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    shareBtn.hidden = !canShare;
    shareBtn.onclick = async () => {
      try {
        await navigator.share({ files: [file], title: 'My Fireside Infograph' });
      } catch (err) {
        if (err && err.name !== 'AbortError') toast('Sharing didn’t work here. Try Download instead.');
      }
    };
    dialog.addEventListener('close', () => {
      URL.revokeObjectURL(url);
      previewImg.removeAttribute('src');
      saveBtn.focus({ preventScroll: true });
    }, { once: true });
    dialog.showModal();
  }

  let saving = false;
  function setBusy(busy) {
    saving = busy;
    saveBtn.classList.toggle('is-busy', busy);
    saveBtn.setAttribute('aria-busy', String(busy));
    $('.save-label', saveBtn).textContent = busy ? 'Saving…' : 'Save';
  }

  saveBtn.addEventListener('click', async () => {
    if (saving) return;
    closePopover(false);
    const missing = missingFields();
    if (missing.length) {
      flagMissing(missing);
      return;
    }
    setBusy(true);
    try {
      persistNow();
      const blob = await renderImage();
      const file = new File([blob], fileName(), { type: 'image/png' });
      if (coarsePointer.matches) {
        openPreview(file);
      } else {
        download(file);
        toast(`Saved ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      toast('Couldn’t create your image. Check your connection and try again.', { duration: 5000 });
    } finally {
      setBusy(false);
    }
  });

  // === INIT ===
  buildSwatches();
  updateThemeName();
  syncDarkButton();
  updateSaveState();
})();
