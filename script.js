// script.js

window.addEventListener('DOMContentLoaded', () => {
  // ——— ELEMENT LOOKUPS —————————————————————————————
  const colorPicker    = document.getElementById("color-picker");
  const clearButton    = document.getElementById("clear-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const saveButton     = document.getElementById("save-button");
  const boxes          = document.querySelectorAll(".box");
  const bonusBoxes     = document.querySelectorAll(".bonus-box");

  let isPointerDown = false;
  let startX        = 0;
  let currentColor  = colorPicker.value || "#000000";

  // ——— TOOLTIP ASSIGNMENT —————————————————————————————
  document.querySelectorAll('.boxes').forEach(group => {
    group.querySelectorAll('.box, .bonus-box').forEach((b, i) => {
      b.title = `${i+1}/10`;
    });
  });

  // ——— COLOR PICKER — live update —————————————————————
  colorPicker.addEventListener("input", e => {
    currentColor = e.target.value;
  });

  // ——— CLEAR BUTTON ————————————————————————————————
  clearButton.addEventListener("click", e => {
    e.preventDefault();
    boxes.forEach(b => b.style.backgroundColor = "");
    bonusBoxes.forEach(b => {
      b.style.backgroundColor = "";
      b.classList.remove("maxed");
    });
  });

  // ——— DRAG‑TO‑PAINT HELPER —————————————————————————
  function handlePointerMove(evt) {
    if (!isPointerDown) return;
    const delta = evt.clientX - startX;
    evt.target.style.backgroundColor = delta > 0 ? currentColor : "";
  }

  // ——— BOXES: POINTER EVENTS & RANGE‑CLICK FILL —————————————————
  boxes.forEach(box => {
    box.addEventListener("pointerdown", e => {
      e.preventDefault();
      isPointerDown = true;
      startX        = e.clientX;
    });
    box.addEventListener("pointermove", handlePointerMove);
    box.addEventListener("pointerup",   () => isPointerDown = false);
    box.addEventListener("pointerleave",() => isPointerDown = false);
    box.addEventListener("pointercancel",() => isPointerDown = false);

    box.addEventListener("click", e => {
      const row = Array.from(e.target.parentNode.querySelectorAll(".box"));
      const idx = row.indexOf(e.target);
      row.forEach((b, i) => {
        b.style.backgroundColor = i <= idx ? currentColor : "";
      });
    });
  });

  // ——— BONUS “MAXED” TOGGLE ——————————————————————————
  bonusBoxes.forEach(bonus => {
    bonus.addEventListener("click", () => {
      bonus.classList.toggle("maxed");
    });
  });

  // ——— DARK MODE SWITCH ————————————————————————————
  darkModeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    darkModeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
  });

  // ——— SAVE AS IMAGE (html2canvas) —————————————————————
  saveButton.addEventListener("click", () => {
    const inputsRect = document.getElementById("input-fields")
                               .getBoundingClientRect();
    const boxesRect  = document.getElementById("box-container")
                               .getBoundingClientRect();

    const x      = Math.min(inputsRect.left, boxesRect.left);
    const y      = inputsRect.top;
    const width  = Math.max(inputsRect.right, boxesRect.right) - x;
    const height = inputsRect.height + boxesRect.height;

    html2canvas(document.body, {
      x, y,
      width, height,
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
