/* Fireside Infograph: theme engine.
 *
 * Loaded synchronously in <head> so the page paints in its theme from the
 * very first frame (no flash of default colours). Everything else lives in
 * script.js, which reads the API exposed on window.Fireside.
 */
(function () {
  'use strict';

  const STORE_KEY = 'fireside-infograph:v1';
  const PAGE_BG = { light: '#F3F2EF', dark: '#0E0E10' };

  // Paired colours. Each pair yields two themes: A on the profile panel with
  // B on the ratings card, and the same pair swapped.
  const PAIRS = [
    ['#745275', 'Dusky Plum',      '#8AB8C2', 'Morning Tide'],
    ['#F0544D', 'Deep Coral',      '#FFFFD8', 'Soft Butter'],
    ['#3DA9D8', 'Ball Blue',       '#F1FF0A', 'Neon Yellow'],
    ['#0F7476', 'Teal',            '#DFAF34', 'Mustard Yellow'],
    ['#F2B33D', 'Sunset Sorbet',   '#3B5B8A', 'Blue Surf'],
    ['#F1FB99', 'Spring Light',    '#6186E4', 'Twilight Blue'],
    ['#FFEB55', 'Sunburst Yellow', '#FF006E', 'Electric Pink'],
    ['#FFEB55', 'Sunburst Yellow', '#913CDC', 'Grape Soda'],
    ['#FF6339', 'Tangerine Crush', '#FFCAFD', 'Bubblegum Pink'],
    ['#FF5F1F', 'Fiery Orange',    '#FFF200', 'Golden Yellow'],
    ['#2A56F2', 'Royal Blue',      '#9DFECB', 'Aquamarine'],
    ['#8AB8C2', 'Morning Tide',    '#1E4D5C', 'Deep Lagoon'],
    ['#FF6EC7', 'Holo Pink',       '#05F0FF', 'Electric Cyan'],
    ['#014AAD', 'Royal Cobalt',    '#CBDFEE', 'Glacier Mist'],
    ['#19485F', 'Ocean',           '#D9E0A4', 'Pistachio'],
    ['#527882', 'Blue Slate',      '#DACD48', 'Citron'],
    ['#004643', 'Cyprus',          '#F0EDE5', 'Sand Dune']
  ];

  const THEMES = [];
  PAIRS.forEach(([a, aName, b, bName]) => {
    THEMES.push({ panel: a, panelName: aName, card: b, cardName: bName });
    THEMES.push({ panel: b, panelName: bName, card: a, cardName: aName });
  });

  // Fill colours offered in the colour popover, in display order.
  const SWATCHES = [
    ['Coral', '#FF6B6B'], ['Tangerine', '#FF8A3D'], ['Amber', '#FFC23D'],
    ['Lime', '#9BE15D'], ['Emerald', '#1DB954'], ['Teal', '#14B8A6'],
    ['Sky', '#38BDF8'], ['Cobalt', '#3B6BFF'], ['Violet', '#8B5CF6'],
    ['Magenta', '#D946EF'], ['Rose', '#FF4F8B'], ['Graphite', '#4A4A55'],
    ['Snow', '#F4F4F5']
  ];

  // === COLOUR UTILITIES (WCAG 2.x relative luminance) ===
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
  }
  function rgba(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a, b) {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function hexToHsl(hex) {
    let [r, g, b] = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, s * 100, l * 100];
  }
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    if (s === 0) { const v = Math.round(l * 255); return rgbToHex(v, v, v); }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const channel = t => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return rgbToHex(
      Math.round(channel(h + 1 / 3) * 255),
      Math.round(channel(h) * 255),
      Math.round(channel(h - 1 / 3) * 255)
    );
  }
  function mix(a, b, t) {
    const x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex(...x.map((v, i) => Math.round(v + (y[i] - v) * t)));
  }
  const hueDistance = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

  // Nudge a colour's lightness (keeping its hue) by the smallest amount, in
  // either direction, that reaches the target contrast against the background.
  function fitContrast(hex, bg, target) {
    if (contrast(hex, bg) >= target) return hex;
    const [h, s, l] = hexToHsl(hex);
    for (let d = 1; d <= 100; d++) {
      for (const dir of [-1, 1]) {
        const nl = l + dir * d;
        if (nl < 0 || nl > 100) continue;
        const candidate = hslToHex(h, s, nl);
        if (contrast(candidate, bg) >= target) return candidate;
      }
    }
    return bestInk(bg);
  }

  // Text colour (near-white or near-black) that reads best on a background.
  function bestInk(bg) {
    return contrast('#FFFFFF', bg) >= contrast('#141416', bg) ? '#FFFFFF' : '#141416';
  }

  // Dark-mode surfaces keep the theme hue but are always genuinely dark.
  function toDark(hex, lightness) {
    const [h, s, l] = hexToHsl(hex);
    return hslToHex(h, Math.min(s, 42), Math.min(l, lightness));
  }

  // Box j (0–8) of a row: a gentle, deliberate light-to-deep ramp.
  function ramp(base, j, total) {
    const [h, s, l] = hexToHsl(base);
    const t = total > 1 ? j / (total - 1) : 0.5;
    return hslToHex(h, s, clamp(l + 9 - t * 18, 6, 94));
  }

  // === PALETTE ===
  function cardsOf(theme) { return [theme.card, toDark(theme.card, 15)]; }

  function buildPalette(theme, dark) {
    const page = dark ? PAGE_BG.dark : PAGE_BG.light;
    const panel = dark ? toDark(theme.panel, 19) : theme.panel;
    const card = dark ? toDark(theme.card, 15) : theme.card;

    // Title: whichever pair colour stands out more on the page, made legible.
    const titleBase = contrast(theme.panel, page) >= contrast(theme.card, page) ? theme.panel : theme.card;
    const title = fitContrast(titleBase, page, 3.5);

    const label = fitContrast(theme.card, panel, 4.5);   // small caps labels
    const heading = fitContrast(theme.panel, card, 3);    // large serif headings (AA large text)
    const cardText = fitContrast(theme.panel, card, 4.5); // small text on the card

    // Theme-name watermark: as quiet as possible while staying readable.
    let labelMuted = label;
    for (let t = 0.05; t <= 0.8; t += 0.05) {
      const candidate = mix(label, panel, t);
      if (contrast(candidate, panel) < 3.2) break;
      labelMuted = candidate;
    }

    // Save button: the title colour, adjusted if needed so its label passes 4.5:1.
    const accentInk = bestInk(title);
    const accent = fitContrast(title, accentInk, 4.5);

    return {
      page, panel, card, title, label, labelMuted, heading, cardText, accent, accentInk,
      glow: rgba(titleBase, dark ? 0.16 : 0.2)
    };
  }

  // Default fill: near-complementary to the panel, kept away from the card
  // hue, and as visible as possible on the light card, the dark card and an
  // empty (white) box. Complementary hues win ties so themes keep character.
  function defaultFill(theme) {
    const [panelHue] = hexToHsl(theme.panel);
    const [cardHue] = hexToHsl(theme.card);
    const against = cardsOf(theme).concat('#FFFFFF');
    let best = null, bestScore = -1;
    [0, 30, -30, 60, -60, 120, -120].forEach((offset, rank) => {
      const hue = (panelHue + 180 + offset + 360) % 360;
      if (hueDistance(hue, cardHue) < 45) return;
      for (let l = 30; l <= 70; l++) {
        const c = hslToHex(hue, 80, l);
        const score = Math.min(...against.map(k => contrast(c, k))) - rank * 0.04;
        if (score > bestScore) { bestScore = score; best = c; }
      }
    });
    return best;
  }

  function swatchesFor(theme) {
    const cards = cardsOf(theme);
    const scored = SWATCHES.map(([name, hex], order) => ({
      name, hex, order, score: Math.min(...cards.map(k => contrast(hex, k)))
    }));
    const picks = scored.sort((a, b) => b.score - a.score).slice(0, 8).sort((a, b) => a.order - b.order);
    return [{ name: 'Theme pick', hex: defaultFill(theme) }].concat(picks.map(({ name, hex }) => ({ name, hex })));
  }

  // === STATE (localStorage, always optional) ===
  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }
  const state = load();
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode etc. */ }
  }

  const root = document.documentElement;
  const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const validIndex = i => Number.isInteger(i) && i >= 0 && i < THEMES.length;

  let themeIndex = validIndex(state.theme) ? state.theme : Math.floor(Math.random() * THEMES.length);
  let dark = typeof state.dark === 'boolean' ? state.dark : !!(systemDark && systemDark.matches);
  let palette = null;
  const darkListeners = [];

  function apply() {
    palette = buildPalette(THEMES[themeIndex], dark);
    const vars = {
      '--page-bg': palette.page,
      '--title': palette.title,
      '--accent': palette.accent,
      '--accent-ink': palette.accentInk,
      '--panel-bg': palette.panel,
      '--label': palette.label,
      '--label-muted': palette.labelMuted,
      '--card-bg': palette.card,
      '--heading': palette.heading,
      '--card-text': palette.cardText,
      '--glow': palette.glow
    };
    Object.keys(vars).forEach(k => root.style.setProperty(k, vars[k]));
    root.classList.toggle('dark', dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', palette.page);
  }

  function setDark(value, remember) {
    dark = !!value;
    if (remember !== false) { state.dark = dark; persist(); }
    apply();
    darkListeners.forEach(fn => fn(dark));
  }

  // Follow the system setting until the person picks a mode themselves.
  if (systemDark) {
    const onSystemChange = e => { if (typeof state.dark !== 'boolean') setDark(e.matches, false); };
    if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
    else if (systemDark.addListener) systemDark.addListener(onSystemChange);
  }

  state.theme = themeIndex;
  persist();
  apply();

  window.Fireside = {
    STORE_KEY,
    THEMES,
    state,
    persist,
    get dark() { return dark; },
    get palette() { return palette; },
    get theme() { return THEMES[themeIndex]; },
    themeName() { const t = THEMES[themeIndex]; return `${t.panelName} × ${t.cardName}`; },
    setDark,
    onDarkChange(fn) { darkListeners.push(fn); },
    shuffleTheme() {
      let next = themeIndex;
      while (next === themeIndex) next = Math.floor(Math.random() * THEMES.length);
      themeIndex = next;
      state.theme = themeIndex;
      persist();
      apply();
    },
    defaultFill() { return defaultFill(THEMES[themeIndex]); },
    swatches() { return swatchesFor(THEMES[themeIndex]); },
    color: { hexToRgb, rgba, contrast, luminance, hexToHsl, hslToHex, fitContrast, bestInk, ramp }
  };
})();
