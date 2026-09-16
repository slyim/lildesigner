// 3D tilt: cards face the cursor while hovered precisely on them.
// Apply with data-tilt on the card + data-glare on its glare layer.

const MAX_TILT = 14; // degrees

function initOne(card: HTMLElement) {
  const glare = card.querySelector<HTMLElement>("[data-glare]");
  let targetRX = 0, targetRY = 0, rx = 0, ry = 0;
  let raf = 0;
  let hovering = false;

  function loop() {
    // smooth lerp toward target tilt
    rx += (targetRX - rx) * 0.12;
    ry += (targetRY - ry) * 0.12;
    card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    if (hovering || Math.abs(targetRX - rx) > 0.01 || Math.abs(targetRY - ry) > 0.01) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
      card.style.transform = "";
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1
    const py = (e.clientY - r.top) / r.height;   // 0..1
    targetRY = (px - 0.5) * MAX_TILT * 2;          // face cursor horizontally
    targetRX = (0.5 - py) * MAX_TILT * 2;          // face cursor vertically
    hovering = true;
    glare?.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    glare?.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    kick();
  });
  card.addEventListener("pointerleave", () => {
    hovering = false;
    targetRX = 0; targetRY = 0;
    kick();
  });
}

export function initTiltCards(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-tilt]").forEach(initOne);
}
