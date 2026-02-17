window.addEventListener('DOMContentLoaded', () => {
  // 1) Theme color palette
  const brightColors = [
    '#FFEBAF', '#4C9DB0', '#19485F', '#D9E0A4', '#F8C61E',
    '#252C37', '#9A0002', '#EFE6DE', '#004643', '#F0EDE5',
    '#745275', '#8AB8C2', '#0E5FB4', '#D8D262'
  ];

  // 2) Pick a random theme color
  const light = brightColors[Math.floor(Math.random() * brightColors.length)];

  // 3) Darker variant
  const dark = (() => {
    const n = parseInt(light.slice(1), 16);
    let r = Math.max(0, ((n >> 16) & 0xFF) - 30);
    let g = Math.max(0, ((n >> 8)  & 0xFF) - 30);
    let b = Math.max(0, ((n)       & 0xFF) - 30);
    return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1).toUpperCase();
  })();

  // 4) Text color via luminance
  const [rT, gT, bT] = light.match(/\w\w/g).map(h => parseInt(h, 16));
  const lum = (0.299*rT + 0.587*gT + 0.114*bT) / 255;
  const textColor = lum > 0.5 ? '#000000' : '#FFFFFF';

  // 5) Apply theme
  const root = document.documentElement;
  root.style.setProperty('--slanted-bg-light',   light);
  root.style.setProperty('--slanted-bg-dark',    dark);
  root.style.setProperty('--slanted-text-color', textColor);

  // === COLOR UTILITIES ===
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
  }

  function rgbToHex(r, g, b) {
    return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1).toUpperCase();
  }

  function adjustBrightness(hex, factor) {
    let [r, g, b] = hexToRgb(hex);
    r = Math.min(255, Math.max(0, Math.round(r * factor)));
    g = Math.min(255, Math.max(0, Math.round(g * factor)));
    b = Math.min(255, Math.max(0, Math.round(b * factor)));
    return rgbToHex(r, g, b);
  }

  function getLuminance(hex) {
    const [r, g, b] = hexToRgb(hex);
    return (0.299*r + 0.587*g + 0.114*b) / 255;
  }

  function hexToHsl(hex) {
    let [r, g, b] = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, s * 100, l * 100];
  }

  function hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const hue2rgb = (p2, q2, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p2 + (q2 - p2) * 6 * t;
        if (t < 1/2) return q2;
        if (t < 2/3) return p2 + (q2 - p2) * (2/3 - t) * 6;
        return p2;
      };
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
  }

  // Gradient: lighter → deeper
  function gradientColor(baseHex, j, total) {
    if (total <= 1) return baseHex;
    const t = j / (total - 1);
    return adjustBrightness(baseHex, 1.12 - t * 0.24);
  }

  // Ensure contrast against background
  function ensureContrast(fgHex, bgLum, lighten) {
    let fg = fgHex;
    for (let i = 0; i < 15; i++) {
      const fgLum = getLuminance(fg);
      const ratio = (Math.max(fgLum, bgLum) + 0.05) /
                    (Math.min(fgLum, bgLum) + 0.05);
      if (ratio >= 3.5) return fg;
      fg = adjustBrightness(fg, lighten ? 1.15 : 0.82);
    }
    return fg;
  }

  // === CATEGORY COLORS ===
  const categoryLight = ensureContrast(light, 0.93, false);
  const categoryDark  = ensureContrast(light, 0.05, true);
  root.style.setProperty('--category-color', categoryLight);
  root.style.setProperty('--category-color-dark', categoryDark);

  // === TITLE GRADIENT — theme color + a hue-rotated complement ===
  const [themeH] = hexToHsl(light);
  const gradientB = hslToHex((themeH + 150) % 360, 70, 55);
  root.style.setProperty('--title-gradient-a', categoryLight);
  root.style.setProperty('--title-gradient-b', gradientB);

  // === 3 CONTRAST FILL SWATCHES ===
  const contrastSwatches = [
    { hex: hslToHex((themeH + 120) % 360, 65, 55), name: 'Contrast A' },
    { hex: hslToHex((themeH + 210) % 360, 65, 55), name: 'Contrast B' },
    { hex: hslToHex((themeH + 300) % 360, 65, 55), name: 'Contrast C' }
  ];

  const palette     = document.getElementById("color-palette");
  const colorPicker = document.getElementById("color-picker");

  contrastSwatches.forEach((c, idx) => {
    const el = document.createElement("div");
    el.className = "color-swatch" + (idx === 0 ? " active" : "");
    el.dataset.color = c.hex;
    el.style.background = c.hex;
    el.title = c.name;
    palette.insertBefore(el, colorPicker);
  });

  // === DOM ELEMENTS ===
  const clearButton    = document.getElementById("clear-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveButton     = document.getElementById("save-button");
  const inputs         = Array.from(document.querySelectorAll("#input-fields input"));
  const boxes          = Array.from(document.querySelectorAll(".box:not(.bonus-box)"));
  const bonusBoxes     = Array.from(document.querySelectorAll(".bonus-box"));
  const swatches       = Array.from(palette.querySelectorAll(".color-swatch"));

  let isPointerDown = false,
      didDrag       = false,
      startX        = 0,
      currentColor  = contrastSwatches[0].hex;

  colorPicker.value = currentColor;
  const DRAG_THRESHOLD = 5;

  // === SWATCH WIRING ===
  function setActiveColor(hex, activeSwatch) {
    currentColor = hex;
    colorPicker.value = hex;
    swatches.forEach(s => s.classList.remove('active'));
    if (activeSwatch) activeSwatch.classList.add('active');
  }

  swatches.forEach(swatch => {
    swatch.addEventListener("click", () => {
      setActiveColor(swatch.dataset.color, swatch);
    });
  });

  colorPicker.addEventListener("input", e => {
    currentColor = e.target.value;
    swatches.forEach(s => s.classList.remove('active'));
  });

  // === CATEGORY TOOLTIPS ===
  const categories = Array.from(document.querySelectorAll(".category[data-desc]"));
  let activeTooltip = null;

  categories.forEach(cat => {
    const tip = document.createElement("span");
    tip.className = "category-tooltip";
    tip.textContent = cat.dataset.desc;
    tip.style.backgroundColor = light;
    tip.style.color = textColor;
    cat.appendChild(tip);

    cat.addEventListener("mouseenter", () => tip.classList.add("visible"));
    cat.addEventListener("mouseleave", () => tip.classList.remove("visible"));

    cat.addEventListener("touchstart", e => {
      e.preventDefault();
      if (activeTooltip && activeTooltip !== tip) activeTooltip.classList.remove("visible");
      tip.classList.toggle("visible");
      activeTooltip = tip.classList.contains("visible") ? tip : null;
    }, { passive: false });
  });

  document.addEventListener("touchstart", e => {
    if (activeTooltip && !e.target.closest(".category")) {
      activeTooltip.classList.remove("visible");
      activeTooltip = null;
    }
  });

  // === SAVE BUTTON VALIDATION ===
  function checkSave() {
    saveButton.disabled = !inputs.every(i => i.value.trim());
  }
  inputs.forEach(i => i.addEventListener("input", checkSave));
  checkSave();

  // === CLEAR ===
  clearButton.addEventListener("click", () => {
    boxes.forEach(b => { b.style.backgroundColor = ""; b.classList.remove("filled"); });
    bonusBoxes.forEach(b => { b.style.backgroundColor = ""; b.classList.remove("maxed"); });
  });

  // === DRAG-TO-PAINT ===
  function handlePointerMove(evt) {
    if (!isPointerDown) return;
    const dx = evt.clientX - startX;
    if (Math.abs(dx) < DRAG_THRESHOLD) return;
    didDrag = true;
    evt.currentTarget.style.backgroundColor = dx > 0 ? currentColor : "";
  }
  document.addEventListener("pointerup", () => isPointerDown = false);

  // === BOX EVENTS ===
  boxes.forEach((box, idx, arr) => {
    box.tabIndex = 0;

    box.addEventListener("pointerdown", e => {
      e.preventDefault();
      isPointerDown = true; didDrag = false; startX = e.clientX;
    });
    box.addEventListener("pointermove", handlePointerMove);
    box.addEventListener("pointercancel", () => { isPointerDown = false; didDrag = false; });

    box.addEventListener("click", () => {
      if (didDrag) { didDrag = false; return; }
      const row = box.parentNode.querySelectorAll(".box:not(.bonus-box)");
      const i = Array.from(row).indexOf(box);
      row.forEach(b => { b.style.backgroundColor = ""; b.classList.remove("filled"); });
      const fillCount = i + 1;
      row.forEach((b, j) => {
        if (j <= i) {
          b.style.backgroundColor = gradientColor(currentColor, j, fillCount);
          b.classList.add("filled");
        }
      });
    });

    box.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); box.click(); }
      if (e.key === "ArrowRight") { e.preventDefault(); (arr[idx+1] || arr[0]).focus(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); (arr[idx-1] || arr[arr.length-1]).focus(); }
    });
  });

  // === BONUS BOX ===
  bonusBoxes.forEach(bonus => {
    bonus.tabIndex = 0;
    bonus.addEventListener("click", () => {
      const isMaxed = bonus.classList.toggle("maxed");
      bonus.style.backgroundColor = isMaxed ? currentColor : "";
    });
    bonus.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); bonus.click(); }
    });
  });

  // === DARK MODE ===
  darkModeToggle.addEventListener("click", () => {
    const dm = document.body.classList.toggle("dark-mode");
    darkModeToggle.setAttribute("aria-pressed", dm);
  });

  // === SAVE AS IMAGE ===
  saveButton.addEventListener("click", () => {
    if (saveButton.disabled) return;
    const container = document.getElementById("infograph-container");
    const controls  = document.getElementById("controls-bar");

    controls.style.display = "none";
    container.classList.add("exporting");

    requestAnimationFrame(() => {
      document.fonts.ready.then(() =>
        html2canvas(container, {
          scale: 2, useCORS: true,
          width: 1200, windowWidth: 1200
        })
        .then(canvas => {
          controls.style.display = "";
          container.classList.remove("exporting");
          const link = document.createElement("a");
          link.download = "fireside-infograph.png";
          link.href = canvas.toDataURL("image/png");
          link.click();
        })
        .catch(err => {
          controls.style.display = "";
          container.classList.remove("exporting");
          console.error(err);
        })
      );
    });
  });
});
