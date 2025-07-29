window.addEventListener('DOMContentLoaded', () => {
  // 1) Palette of 14 curated colors
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

  // 2) Pick a random light variant
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

  // 4) Decide label text‑color via relative luminance
  const [r, g, b] = light.match(/\w\w/g).map(h => parseInt(h, 16));
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  const textColor = lum > 0.5 ? '#000000' : '#FFFFFF';

  // 5) Apply these to CSS variables on :root
  const root = document.documentElement;
  root.style.setProperty('--slanted-bg-light',   light);
  root.style.setProperty('--slanted-bg-dark',    dark);
  root.style.setProperty('--slanted-text-color', textColor);

  // 6) Grab DOM elements
  const colorPicker    = document.getElementById("color-picker");
  const clearButton    = document.getElementById("clear-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveButton     = document.getElementById("save-button");
  const inputs         = Array.from(document.querySelectorAll("#input-fields input"));
  const boxes          = Array.from(document.querySelectorAll(".box"));
  const bonusBoxes     = Array.from(document.querySelectorAll(".bonus-box"));

  let isPointerDown = false,
      startX        = 0,
      currentColor  = colorPicker.value;

  // 7) Enable/disable the “Save as Image” button
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

  // 9) Drag‑to‑paint helper
  function handlePointerMove(evt) {
    if (!isPointerDown) return;
    evt.target.style.backgroundColor = evt.clientX - startX > 0
      ? currentColor
      : "";
  }
  document.addEventListener("pointerup", () => isPointerDown = false);

  // 10) Box event wiring
  boxes.forEach((box, idx, arr) => {
    box.tabIndex = 0; // make focusable

    // pointer events
    box.addEventListener("pointerdown", e => {
      e.preventDefault();
      isPointerDown = true;
      startX = e.clientX;
    });
    box.addEventListener("pointermove", handlePointerMove);
    box.addEventListener("pointerleave", () => isPointerDown = false);
    box.addEventListener("pointercancel", () => isPointerDown = false);

    // click to fill all up to this box
    box.addEventListener("click", () => {
      const row = box.parentNode.querySelectorAll(".box");
      const i   = Array.from(row).indexOf(box);

      // clear previous
      row.forEach(b => {
        b.style.backgroundColor = "";
        b.classList.remove("filled");
      });

      // fill up to i
      row.forEach((b, j) => {
        if (j <= i) {
          b.style.backgroundColor = currentColor;
          b.classList.add("filled");
        }
      });
    });

    // keyboard support: Space/Enter to fill, arrows to navigate
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

  // 11) Bonus‑box “maxed” toggle + keyboard
  bonusBoxes.forEach(bonus => {
    bonus.tabIndex = 0;
    bonus.addEventListener("click", () => bonus.classList.toggle("maxed"));
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

  // 13) Save as Image
  saveButton.addEventListener("click", () => {
    if (saveButton.disabled) {
      alert("Please complete before saving");
      return;
    }
    document.fonts.ready.then(() =>
      html2canvas(document.getElementById("infograph-container"), {
        scale: 2,
        useCORS: true
      })
      .then(canvas => {
        const link = document.createElement("a");
        link.download = "fireside-infograph.png";
        link.href     = canvas.toDataURL("image/png");
        link.click();
      })
      .catch(console.error)
    );
  });

  // 14) Color picker live update
  colorPicker.addEventListener("input", e => {
    currentColor = e.target.value;
  });
});
