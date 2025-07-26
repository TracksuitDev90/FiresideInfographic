window.addEventListener('DOMContentLoaded', () => {
  const colorPicker    = document.getElementById("color-picker");
  const clearButton    = document.getElementById("clear-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveButton     = document.getElementById("save-button");
  const inputs         = Array.from(document.querySelectorAll("#input-fields input"));
  const boxes          = document.querySelectorAll(".box");
  const bonusBoxes     = document.querySelectorAll(".bonus-box");

  let isPointerDown = false;
  let startX        = 0;
  let currentColor  = colorPicker.value;

  // Tooltips
  document.querySelectorAll('.boxes').forEach(group => {
    group.querySelectorAll('.box, .bonus-box').forEach((b,i) => {
      b.title = `${i+1}/10`;
    });
  });

  // Color picker (no longer ties into save-button)
  colorPicker.addEventListener("input", e => {
    currentColor = e.target.value;
  });

  // Enable save only when all text inputs have content
  function checkSaveEnabled() {
    const allFilled = inputs.every(inp => inp.value.trim() !== "");
    saveButton.disabled = !allFilled;
  }
  inputs.forEach(inp => inp.addEventListener("input", checkSaveEnabled));
  checkSaveEnabled();

  // Clear
  clearButton.addEventListener("click", e => {
    e.preventDefault();
    boxes.forEach(b => b.style.backgroundColor = "");
    bonusBoxes.forEach(b => {
      b.style.backgroundColor = "";
      b.classList.remove("maxed");
    });
  });

  // Drag‑to‑paint
  function handlePointerMove(evt) {
    if (!isPointerDown) return;
    const delta = evt.clientX - startX;
    evt.target.style.backgroundColor = delta > 0 ? currentColor : "";
  }
  document.addEventListener("pointerup", () => isPointerDown = false);
  boxes.forEach(box => {
    box.addEventListener("pointerdown", e => {
      e.preventDefault();
      isPointerDown = true;
      startX        = e.clientX;
    });
    box.addEventListener("pointermove", handlePointerMove);
    box.addEventListener("pointerleave", () => isPointerDown = false);
    box.addEventListener("pointercancel",() => isPointerDown = false);
    box.addEventListener("click", e => {
      const row = Array.from(e.target.parentNode.querySelectorAll(".box"));
      const idx = row.indexOf(e.target);
      row.forEach((b, i) => {
        b.style.backgroundColor = i <= idx ? currentColor : "";
      });
    });
  });

  // Bonus toggle
  bonusBoxes.forEach(bonus => {
    bonus.addEventListener("click", () => {
      bonus.classList.toggle("maxed");
    });
  });

  // Dark mode toggle with aria-pressed
  darkModeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    darkModeToggle.setAttribute("aria-pressed", isDark);
  });

  // Save as Image
  saveButton.addEventListener("click", () => {
    const inputsRect = document.getElementById("input-fields").getBoundingClientRect();
    const boxesRect  = document.getElementById("box-container").getBoundingClientRect();
    const x      = Math.min(inputsRect.left, boxesRect.left);
    const y      = inputsRect.top;
    const width  = Math.max(inputsRect.right, boxesRect.right) - x;
    const height = inputsRect.height + boxesRect.height;

    html2canvas(document.body, {
      x, y, width, height,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      scale: 2,
      useCORS: true
    })
    .then(canvas => {
      const link = document.createElement("a");
      link.download = "fireside-infograph.png";
      link.href     = canvas.toDataURL("image/png");
      link.click();
    })
    .catch(err => console.error("Save failed:", err));
  });
});
