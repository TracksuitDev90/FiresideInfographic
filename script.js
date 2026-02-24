window.addEventListener('DOMContentLoaded', () => {
  // 1) Paired color themes — each pair yields 2 variants (swap bg/text)
  const colorPairs = [
    { a: { hex: '#745275', name: 'Lavender Fog' },    b: { hex: '#8AB8C2', name: 'Morning Tide' } },
    { a: { hex: '#F0544D', name: 'Deep Coral' },      b: { hex: '#FFFFD8', name: 'Soft Mint' } },
    { a: { hex: '#3DA9D8', name: 'Ball Blue' },       b: { hex: '#F1FF0A', name: 'Neon Yellow' } },
    { a: { hex: '#0F7476', name: 'Teal' },            b: { hex: '#DFAF34', name: 'Mustard Yellow' } },
    { a: { hex: '#F2B33D', name: 'Sunset Sorbet' },   b: { hex: '#3B5B8A', name: 'Blue Surf' } },
    { a: { hex: '#F1FB99', name: 'Spring Light' },    b: { hex: '#6186E4', name: 'Twilight Blue' } },
    { a: { hex: '#FFEB55', name: 'Sunburst Yellow' }, b: { hex: '#FF006E', name: 'Electric Pink' } },
    { a: { hex: '#FFEB55', name: 'Sunburst Yellow' }, b: { hex: '#913CDC', name: 'Grape Soda' } },
    { a: { hex: '#FF6339', name: 'Tangerine Crush' }, b: { hex: '#FFCAFD', name: 'Bubblegum Pink' } },
    { a: { hex: '#FF5F1F', name: 'Fiery Orange' },    b: { hex: '#FFF200', name: 'Golden Yellow' } },
    { a: { hex: '#2A56F2', name: 'Royal Blue' },      b: { hex: '#9DFECB', name: 'Aquamarine' } },
    { a: { hex: '#8AB8C2', name: 'Morning Tide' },    b: { hex: '#488496', name: 'Azure Mist' } },
    { a: { hex: '#FF6EC7', name: 'Holo Pink' },       b: { hex: '#05F0FF', name: 'Electric Cyan' } }
  ];

  // Build all 26 variants (each pair flipped both ways)
  const allThemes = [];
  colorPairs.forEach(pair => {
    allThemes.push({ bg: pair.a.hex, bgName: pair.a.name, text: pair.b.hex, textName: pair.b.name });
    allThemes.push({ bg: pair.b.hex, bgName: pair.b.name, text: pair.a.hex, textName: pair.a.name });
  });

  // 2) Pick a random variant
  const theme = allThemes[Math.floor(Math.random() * allThemes.length)];
  const light     = theme.bg;
  const textColor = theme.text;
  const themeName = theme.bgName;

  // 3) Darker variant for dark mode
  const dark = (() => {
    const n = parseInt(light.slice(1), 16);
    let r = Math.max(0, ((n >> 16) & 0xFF) - 30);
    let g = Math.max(0, ((n >> 8)  & 0xFF) - 30);
    let b = Math.max(0, ((n)       & 0xFF) - 30);
    return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1).toUpperCase();
  })();

  // 4) Apply theme
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

  // Gradient: very subtle lighter -> slightly deeper
  function gradientColor(baseHex, j, total) {
    if (total <= 1) return baseHex;
    const t = j / (total - 1);
    return adjustBrightness(baseHex, 1.04 - t * 0.08);
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

  // === DARK MODE — lighten theme for better contrast ===
  // Compute a lightened variant of the theme for dark mode table bg
  const [dH, dS, dL] = hexToHsl(dark);
  const darkLightened = hslToHex(dH, Math.min(dS, 40), Math.max(dL + 15, 25));
  root.style.setProperty('--slanted-bg-dark', darkLightened);

  // === TITLE COLOR — 10% darker (light mode) / 10% lighter (dark mode) ===
  const [themeH] = hexToHsl(light);
  const titleColorLight = adjustBrightness(light, 0.90);
  const titleColorDark  = adjustBrightness(light, 1.10);
  root.style.setProperty('--title-color', titleColorLight);
  root.style.setProperty('--title-color-dark', titleColorDark);

  // === THEME WATERMARK in bottom-right of table ===
  const styledTable = document.querySelector('.styled-table');
  const watermark = document.createElement('span');
  watermark.className = 'theme-watermark';
  watermark.textContent = themeName;
  // 15% darker or lighter depending on base luminance
  const wmLum = getLuminance(light);
  const wmColor = wmLum > 0.5
    ? adjustBrightness(light, 0.85)   // darken 15%
    : adjustBrightness(light, 1.15);  // lighten 15%
  watermark.style.color = wmColor;
  styledTable.appendChild(watermark);

  // === COLOR PICKER (direct spectrum) ===
  const colorPicker = document.getElementById("color-picker");

  // === DOM ELEMENTS ===
  const clearButton    = document.getElementById("clear-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveButton     = document.getElementById("save-button");
  const inputs         = Array.from(document.querySelectorAll("#input-fields input"));
  const boxes          = Array.from(document.querySelectorAll(".box:not(.bonus-box)"));
  const bonusBoxes     = Array.from(document.querySelectorAll(".bonus-box"));

  // Default fill: a contrasting hue from the theme
  let currentColor = hslToHex((themeH + 180) % 360, 65, 55);
  colorPicker.value = currentColor;

  colorPicker.addEventListener("input", e => {
    currentColor = e.target.value;
  });

  // === DETECT MOBILE (for picker behavior) ===
  const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // === PICKER INPUTS (Age / MBTI) ===
  const mbtiOptions = ['Unknown', 'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
  const ageOptions = Array.from({ length: 82 }, (_, i) => String(18 + i));

  const pickerConfigs = {
    age:  { options: ageOptions,  label: 'Age', selected: '' },
    mbti: { options: mbtiOptions, label: 'Personality Type', selected: '' }
  };

  document.querySelectorAll('.picker-wrap').forEach(wrapper => {
    const key = wrapper.dataset.picker;
    const config = pickerConfigs[key];
    if (!config) return;

    const input    = wrapper.querySelector('input');
    const dropdown = wrapper.querySelector('.picker-dropdown');

    // Populate dropdown options
    config.options.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'picker-option';
      div.textContent = opt;
      div.dataset.value = opt;
      dropdown.appendChild(div);
    });

    if (isMobile) {
      // === MOBILE: bottom sheet overlay ===
      const overlay = document.createElement('div');
      overlay.className = 'picker-overlay';
      overlay.innerHTML = `
        <div class="picker-sheet">
          <div class="picker-sheet-header">
            <span>${config.label}</span>
            <button class="picker-sheet-done" type="button">Done</button>
          </div>
          <div class="picker-sheet-scroll"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      const scrollContainer = overlay.querySelector('.picker-sheet-scroll');
      const doneBtn = overlay.querySelector('.picker-sheet-done');

      config.options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'picker-option';
        div.textContent = opt;
        div.dataset.value = opt;
        scrollContainer.appendChild(div);
      });

      input.addEventListener('click', (e) => {
        e.preventDefault();
        // Mark current selection
        scrollContainer.querySelectorAll('.picker-option').forEach(o => {
          o.classList.toggle('selected', o.dataset.value === config.selected);
        });
        overlay.classList.add('open');
        // Scroll to selected item
        const sel = scrollContainer.querySelector('.picker-option.selected');
        if (sel) sel.scrollIntoView({ block: 'center' });
      });

      scrollContainer.addEventListener('click', (e) => {
        const opt = e.target.closest('.picker-option');
        if (!opt) return;
        config.selected = opt.dataset.value;
        input.value = config.selected;
        scrollContainer.querySelectorAll('.picker-option').forEach(o => {
          o.classList.toggle('selected', o.dataset.value === config.selected);
        });
        checkSave();
      });

      doneBtn.addEventListener('click', () => {
        overlay.classList.remove('open');
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    } else {
      // === DESKTOP: dropdown on click ===
      input.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other dropdowns
        document.querySelectorAll('.picker-dropdown.open').forEach(d => {
          if (d !== dropdown) d.classList.remove('open');
        });
        // Mark current selection
        dropdown.querySelectorAll('.picker-option').forEach(o => {
          o.classList.toggle('selected', o.dataset.value === config.selected);
        });
        dropdown.classList.toggle('open');
        // Scroll to selected
        const sel = dropdown.querySelector('.picker-option.selected');
        if (sel) sel.scrollIntoView({ block: 'center' });
      });

      dropdown.addEventListener('click', (e) => {
        const opt = e.target.closest('.picker-option');
        if (!opt) return;
        config.selected = opt.dataset.value;
        input.value = config.selected;
        dropdown.querySelectorAll('.picker-option').forEach(o => {
          o.classList.toggle('selected', o.dataset.value === config.selected);
        });
        dropdown.classList.remove('open');
        checkSave();
      });

      // Also support wheel on the input for desktop
      wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        const idx = config.options.indexOf(config.selected);
        let next;
        if (e.deltaY > 0) {
          next = (idx === -1 || idx >= config.options.length - 1) ? 0 : idx + 1;
        } else {
          next = (idx <= 0) ? config.options.length - 1 : idx - 1;
        }
        config.selected = config.options[next];
        input.value = config.selected;
        checkSave();
      }, { passive: false });
    }
  });

  // Close desktop dropdowns on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.picker-dropdown.open').forEach(d => d.classList.remove('open'));
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
    bonusBoxes.forEach(b => { b.style.background = ""; b.classList.remove("maxed"); });
  });

  // === TOUCH-SLIDE FILL (mobile) + CLICK FILL (desktop) ===
  // Helper: fill boxes up to index in a row
  function fillRowUpTo(row, upToIdx) {
    const rowBoxes = Array.from(row.querySelectorAll(".box:not(.bonus-box)"));
    const fillCount = upToIdx + 1;
    rowBoxes.forEach((b, j) => {
      if (j <= upToIdx) {
        b.style.backgroundColor = gradientColor(currentColor, j, fillCount);
        if (!b.classList.contains("filled")) b.classList.add("filled");
      } else {
        b.style.backgroundColor = "";
        b.classList.remove("filled");
      }
    });
  }

  // Helper: clear all boxes in a row
  function clearRow(row) {
    const rowBoxes = Array.from(row.querySelectorAll(".box:not(.bonus-box)"));
    rowBoxes.forEach(b => {
      b.style.backgroundColor = "";
      b.classList.remove("filled");
    });
  }

  // Track touch state for smooth slide fill
  let touchRow = null;
  let lastTouchIdx = -1;

  boxes.forEach((box, idx, arr) => {
    box.tabIndex = 0;

    // === TOUCH EVENTS — smooth slide to fill/unfill ===
    box.addEventListener("touchstart", e => {
      e.preventDefault();
      const row = box.closest('.boxes');
      touchRow = row;
      const rowBoxes = Array.from(row.querySelectorAll(".box:not(.bonus-box)"));
      const i = rowBoxes.indexOf(box);
      lastTouchIdx = i;
      fillRowUpTo(row, i);
    }, { passive: false });

    box.addEventListener("touchmove", e => {
      e.preventDefault();
      if (!touchRow) return;
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!el) return;
      const targetBox = el.closest('.box:not(.bonus-box)');
      if (!targetBox) return;
      const row = targetBox.closest('.boxes');
      if (row !== touchRow) return;
      const rowBoxes = Array.from(row.querySelectorAll(".box:not(.bonus-box)"));
      const i = rowBoxes.indexOf(targetBox);
      if (i === -1 || i === lastTouchIdx) return;
      lastTouchIdx = i;
      fillRowUpTo(row, i);
    }, { passive: false });

    box.addEventListener("touchend", () => {
      touchRow = null;
      lastTouchIdx = -1;
    });

    box.addEventListener("touchcancel", () => {
      touchRow = null;
      lastTouchIdx = -1;
    });

    // === CLICK (desktop) — tap fills all up to clicked box ===
    box.addEventListener("click", () => {
      const row = box.closest('.boxes');
      const rowBoxes = Array.from(row.querySelectorAll(".box:not(.bonus-box)"));
      const i = rowBoxes.indexOf(box);
      // If clicking the same last filled box, toggle off
      const currentlyFilled = rowBoxes.filter(b => b.classList.contains("filled")).length;
      if (currentlyFilled === i + 1) {
        clearRow(row);
      } else {
        fillRowUpTo(row, i);
      }
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
      // Use `background` (not backgroundColor) to override the hatched pattern
      bonus.style.background = isMaxed ? currentColor : "";
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
