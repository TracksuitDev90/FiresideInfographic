window.addEventListener('DOMContentLoaded', () => {
  const styledTable = document.querySelector('.styled-table');
  const brightColors = [
    '#FF6B6B', '#FFD93D', '#6BCB77',
    '#4D96FF', '#FF9CEE', '#FDFFB6'
  ];

  // Pick random bright color & darken by 50
  const light = brightColors[Math.floor(Math.random() * brightColors.length)];
  const dark = (() => {
    const amt = 50;
    const num = parseInt(light.slice(1), 16);
    let r = (num >> 16) - amt;
    let g = ((num >> 8) & 0xff) - amt;
    let b = (num & 0xff) - amt;
    r = r < 0 ? 0 : r; g = g < 0 ? 0 : g; b = b < 0 ? 0 : b;
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b)
      .toString(16)
      .slice(1)
      .toUpperCase();
  })();

  styledTable.style.setProperty('--slanted-bg-light', light);
  styledTable.style.setProperty('--slanted-bg-dark', dark);

  // Core UI hooks
  const colorPicker    = document.getElementById("color-picker");
  const clearButton    = document.getElementById("clear-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveButton     = document.getElementById("save-button");
  const inputs         = Array.from(document.querySelectorAll("#input-fields input"));
  const boxes          = document.querySelectorAll(".box");
  const bonusBoxes     = document.querySelectorAll(".bonus-box");

  let isPointerDown = false,
      startX        = 0,
      currentColor  = colorPicker.value;

  // Enable Save only when all inputs filled
  function checkSave() {
    saveButton.disabled = !inputs.every(i => i.value.trim());
  }
  inputs.forEach(i => i.addEventListener("input", checkSave));
  checkSave();

  // Clear all fills/maxes
  clearButton.addEventListener("click", e => {
    e.preventDefault();
    boxes.forEach(b => b.style.backgroundColor = "");
    bonusBoxes.forEach(b => {
      b.style.backgroundColor = "";
      b.classList.remove("maxed");
    });
  });

  // Paint logic
  function paintMove(evt) {
    if (!isPointerDown) return;
    evt.target.style.backgroundColor =
      evt.clientX - startX > 0 ? currentColor : "";
  }
  document.addEventListener("pointerup", () => isPointerDown = false);
  boxes.forEach(box => {
    box.addEventListener("pointerdown", e => {
      e.preventDefault();
      isPointerDown = true;
      startX = e.clientX;
    });
    box.addEventListener("pointermove", paintMove);
    box.addEventListener("pointerleave", () => isPointerDown = false);
    box.addEventListener("pointercancel", () => isPointerDown = false);
    box.addEventListener("click", e => {
      const row = Array.from(e.target.parentNode.querySelectorAll(".box"));
      const idx = row.indexOf(e.target);
      row.forEach((c, i) => {
        c.style.backgroundColor = i <= idx ? currentColor : "";
      });
    });
  });

  // Bonus toggle
  bonusBoxes.forEach(b => b.addEventListener("click", () => {
    b.classList.toggle("maxed");
  }));

  // Dark mode toggle
  darkModeToggle.addEventListener("click", () => {
    const dm = document.body.classList.toggle("dark-mode");
    darkModeToggle.setAttribute("aria-pressed", dm);
  });

  // Save as image (includes scroll offsets for mobile)
  saveButton.addEventListener("click", () => {
    if (saveButton.disabled) {
      alert("Please complete before saving");
      return;
    }
    html2canvas(document.getElementById("infograph-container"), {
      scale: 2,
      useCORS: true,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY
    })
    .then(canvas => {
      const link = document.createElement("a");
      link.download = "fireside-infograph.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
    .catch(console.error);
  });

  // Update currentColor
  colorPicker.addEventListener("input", e => {
    currentColor = e.target.value;
  });
});
