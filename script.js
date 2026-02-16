window.addEventListener('DOMContentLoaded', () => {
  // 1) Palette of 14 curated theme colors (for the form/buttons, NOT fill color)
  const brightColors = [
    '#FFEBAF', // Vanilla
    '#4C9DB0', // Moonstone
    '#19485F', // Ocean
    '#D9E0A4', // Lime
    '#F8C61E', // Sunburst
    '#252C37', // Midnight
    '#9A0002', // Cherry Cola
    '#EFE6DE', // Cream Vanilla
    '#004643', // Cyprus
    '#F0EDE5', // Sand Dune
    '#745275', // Lavender Fog
    '#8AB8C2', // Morning Tide
    '#0E5FB4', // True Blue
    '#D8D262'  // Mustard Seed
  ];

  // 2) Pick a random theme color
  const light = brightColors[Math.floor(Math.random() * brightColors.length)];

  // 3) Compute a darker variant by subtracting 30 from each RGB channel
  const amt = 30;
  const dark = (() => {
    const n = parseInt(light.slice(1), 16);
    let r = (n >> 16) & 0xFF;
    let g = (n >>  8) & 0xFF;
    let b = (n      ) & 0xFF;
    r = Math.max(0, r - amt);
    g = Math.max(0, g - amt);
    b = Math.max(0, b - amt);
    return '#' + ((1<<24)|(r<<16)|(g<<8)|b)
      .toString(16)
      .slice(1)
      .toUpperCase();
  })();

  // 4) Decide label text-color via relative luminance
  const [rT, gT, bT] = light.match(/\w\w/g).map(h => parseInt(h, 16));
  const lum = (0.299*rT + 0.587*gT + 0.114*bT) / 255;
  const textColor = lum > 0.5 ? '#000000' : '#FFFFFF';

  // 5) Apply these to CSS variables on :root
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

  // Shift brightness by a factor (1.0 = unchanged, >1 = lighter, <1 = darker)
  function adjustBrightness(hex, factor) {
    let [r, g, b] = hexToRgb(hex);
    r = Math.min(255, Math.max(0, Math.round(r * factor)));
    g = Math.min(255, Math.max(0, Math.round(g * factor)));
    b = Math.min(255, Math.max(0, Math.round(b * factor)));
    return rgbToHex(r, g, b);
  }

  // Compute luminance for contrast text on tooltip
  function getLuminance(hex) {
    const [r, g, b] = hexToRgb(hex);
    return (0.299*r + 0.587*g + 0.114*b) / 255;
  }

  // Compute gradient color for a box at position j out of total filled boxes
  // Goes from slightly darker to slightly lighter across the row
  function gradientColor(baseHex, j, total) {
    if (total <= 1) return baseHex;
    // Range: 0.92 (darker) to 1.08 (lighter) — subtle 16% spread
    const t = j / (total - 1);
    const factor = 0.92 + t * 0.16;
    return adjustBrightness(baseHex, factor);
  }

  // 6) Grab DOM elements
  const colorPicker    = document.getElementById("color-picker");
  const clearButton    = document.getElementById("clear-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveButton     = document.getElementById("save-button");
  const inputs         = Array.from(document.querySelectorAll("#input-fields input"));
  const boxes          = Array.from(document.querySelectorAll(".box:not(.bonus-box)"));
  const bonusBoxes     = Array.from(document.querySelectorAll(".bonus-box"));
  const swatches       = Array.from(document.querySelectorAll(".color-swatch"));

  // Feature 3: Default fill color is first swatch (NOT the theme color)
  let isPointerDown = false,
      didDrag       = false,
      startX        = 0,
      currentColor  = '#FF6B6B';

  colorPicker.value = currentColor;

  const DRAG_THRESHOLD = 5;

  // === FEATURE 3: COLOR PALETTE SWATCH WIRING ===
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
    // Deselect all swatches since custom color is in use
    swatches.forEach(s => s.classList.remove('active'));
  });

  // === FEATURE 1: CATEGORY DESCRIPTION TOOLTIPS ===
  const categories = Array.from(document.querySelectorAll(".category[data-desc]"));
  let activeTooltip = null;

  categories.forEach(cat => {
    // Create tooltip element
    const tip = document.createElement("span");
    tip.className = "category-tooltip";
    tip.textContent = cat.dataset.desc;
    // Style using theme colors
    tip.style.backgroundColor = light;
    tip.style.color = textColor;
    cat.appendChild(tip);

    // Desktop: hover
    cat.addEventListener("mouseenter", () => {
      tip.classList.add("visible");
    });
    cat.addEventListener("mouseleave", () => {
      tip.classList.remove("visible");
    });

    // Mobile: tap to toggle
    cat.addEventListener("touchstart", e => {
      e.preventDefault();
      if (activeTooltip && activeTooltip !== tip) {
        activeTooltip.classList.remove("visible");
      }
      tip.classList.toggle("visible");
      activeTooltip = tip.classList.contains("visible") ? tip : null;
    }, { passive: false });
  });

  // Dismiss tooltip on tap elsewhere (mobile)
  document.addEventListener("touchstart", e => {
    if (activeTooltip && !e.target.closest(".category")) {
      activeTooltip.classList.remove("visible");
      activeTooltip = null;
    }
  });

  // 7) Enable/disable the "Save as Image" button
  function checkSave() {
    saveButton.disabled = !inputs.every(i => i.value.trim());
  }
  inputs.forEach(i => i.addEventListener("input", checkSave));
  checkSave();

  // 8) Clear all fills
  clearButton.addEventListener("click", () => {
    boxes.forEach(b => {
      b.style.backgroundColor = "";
      b.classList.remove("filled");
    });
    bonusBoxes.forEach(b => {
      b.style.backgroundColor = "";
      b.classList.remove("maxed");
    });
  });

  // 9) Drag-to-paint helper (with gradient)
  function handlePointerMove(evt) {
    if (!isPointerDown) return;
    const dx = evt.clientX - startX;
    if (Math.abs(dx) < DRAG_THRESHOLD) return;
    didDrag = true;
    evt.currentTarget.style.backgroundColor = dx > 0 ? currentColor : "";
  }
  document.addEventListener("pointerup", () => isPointerDown = false);

  // 10) Box event wiring
  boxes.forEach((box, idx, arr) => {
    box.tabIndex = 0;

    box.addEventListener("pointerdown", e => {
      e.preventDefault();
      isPointerDown = true;
      didDrag = false;
      startX = e.clientX;
    });
    box.addEventListener("pointermove", handlePointerMove);
    box.addEventListener("pointercancel", () => { isPointerDown = false; didDrag = false; });

    // Click to fill all up to this box (with gradient - Feature 2)
    box.addEventListener("click", () => {
      if (didDrag) { didDrag = false; return; }
      const row = box.parentNode.querySelectorAll(".box:not(.bonus-box)");
      const i   = Array.from(row).indexOf(box);

      // clear previous
      row.forEach(b => {
        b.style.backgroundColor = "";
        b.classList.remove("filled");
      });

      // fill up to i with gradient
      const fillCount = i + 1;
      row.forEach((b, j) => {
        if (j <= i) {
          b.style.backgroundColor = gradientColor(currentColor, j, fillCount);
          b.classList.add("filled");
        }
      });
    });

    // keyboard support
    box.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        box.click();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = arr[idx+1] || arr[0];
        next.focus();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = arr[idx-1] || arr[arr.length-1];
        prev.focus();
      }
    });
  });

  // 11) Bonus-box "maxed" toggle + keyboard
  bonusBoxes.forEach(bonus => {
    bonus.tabIndex = 0;
    bonus.addEventListener("click", () => {
      const isMaxed = bonus.classList.toggle("maxed");
      bonus.style.backgroundColor = isMaxed ? currentColor : "";
    });
    bonus.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        bonus.click();
      }
    });
  });

  // 12) Dark Mode toggle
  darkModeToggle.addEventListener("click", () => {
    const dm = document.body.classList.toggle("dark-mode");
    darkModeToggle.setAttribute("aria-pressed", dm);
  });

  // 13) Save as Image (Feature 4: consistent widescreen export)
  saveButton.addEventListener("click", () => {
    if (saveButton.disabled) {
      alert("Please complete before saving");
      return;
    }
    const container = document.getElementById("infograph-container");
    const controls  = document.getElementById("container");

    // Hide controls and force fixed widescreen layout
    controls.style.display = "none";
    container.classList.add("exporting");

    // Wait for layout reflow + fonts before capture
    requestAnimationFrame(() => {
      document.fonts.ready.then(() =>
        html2canvas(container, {
          scale: 2,
          useCORS: true,
          width: 1200,
          windowWidth: 1200
        })
        .then(canvas => {
          controls.style.display = "";
          container.classList.remove("exporting");
          const link = document.createElement("a");
          link.download = "fireside-infograph.png";
          link.href     = canvas.toDataURL("image/png");
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
