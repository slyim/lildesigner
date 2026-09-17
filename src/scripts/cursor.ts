// Custom blob cursor: a gooey morphing blob trails the pointer with a soft
// lerp, squishing and stretching along its velocity, shedding fading
// droplets as it moves and rippling on click. It swells over anything
// interactive. Desktop pointers only — touch and reduced-motion users keep
// the native cursor.

const INTERACTIVE = 'a[href], button, input, textarea, select, [role="button"], [data-tilt]';
const TRAIL_POOL = 24;
const TRAIL_EVERY_MS = 32;

export function initCustomCursor() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // desktop pointers only: a fine primary pointer excludes phones and
  // tablets even when they report a hover capability (trackpads, styli)
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const blob = document.createElement("div");
  blob.className = "cursor-blob";
  blob.setAttribute("aria-hidden", "true");
  document.body.appendChild(blob);
  // hide the native cursor only once the blob exists to take over
  document.body.classList.add("custom-cursor");

  // droplet trail pool (reused divs, animated with WAAPI)
  const trail: HTMLDivElement[] = [];
  for (let i = 0; i < TRAIL_POOL; i++) {
    const dot = document.createElement("div");
    dot.className = "cursor-trail";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    trail.push(dot);
  }
  let trailIdx = 0;
  let lastDrop = 0;
  const drop = (x: number, y: number, big: boolean) => {
    const dot = trail[trailIdx];
    trailIdx = (trailIdx + 1) % trail.length;
    const size = big ? 14 : 6 + Math.random() * 6;
    dot.style.width = `${size.toFixed(0)}px`;
    dot.style.height = `${size.toFixed(0)}px`;
    // scale rides inside `transform`, never the individual `scale` property:
    // individual scale premultiplies the translate() positioning, which flings
    // every droplet toward the top-left corner as it shrinks.
    const at = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    dot.style.transform = at;
    dot.animate(
      [
        { opacity: big ? 0.8 : 0.55, transform: `${at} scale(1)` },
        { opacity: 0, transform: `${at} scale(0.2)` },
      ],
      { duration: big ? 650 : 450 + Math.random() * 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  };

  // click ripple ring (single reused div)
  const ripple = document.createElement("div");
  ripple.className = "cursor-ripple";
  ripple.setAttribute("aria-hidden", "true");
  document.body.appendChild(ripple);
  const pop = (x: number, y: number) => {
    // same as drop(): scale inside `transform` so the ring grows in place
    // instead of sweeping in from the top-left as it scales up.
    const at = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    ripple.style.transform = at;
    ripple.animate(
      [
        { opacity: 0.9, transform: `${at} scale(0.3)` },
        { opacity: 0, transform: `${at} scale(1.6)` },
      ],
      { duration: 550, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  };

  let tx = -100, ty = -100, x = -100, y = -100;
  let vx = 0, vy = 0; // smoothed velocity (px/frame)
  let angle = 0; // smoothed travel direction (deg) — never snaps
  let stretch = 0; // smoothed elongation
  let hover = 0, hoverTarget = 0; // 0 = dot, 1 = swollen
  let shown = false;
  let raf = 0;

  const loop = () => {
    const px = x, py = y;
    x += (tx - x) * 0.2;
    y += (ty - y) * 0.2;
    // velocity from actual displacement, smoothed
    vx += (x - px - vx) * 0.35;
    vy += (y - py - vy) * 0.35;
    hover += (hoverTarget - hover) * 0.18;

    // squish & stretch along the AXIS of travel (mod 180°): reversing
    // direction must not spin the blob — up and down share one orientation.
    // Eases along the shortest arc and freezes when slow, so it never snaps.
    const speed = Math.hypot(vx, vy);
    stretch += ((speed > 0.6 ? Math.min(0.4, speed * 0.03) : 0) - stretch) * 0.25;
    if (speed > 0.6) {
      const target = (((Math.atan2(vy, vx) * 180) / Math.PI % 180) + 180) % 180;
      const cur = ((angle % 180) + 180) % 180;
      let d = target - cur;
      if (d > 90) d -= 180;
      else if (d < -90) d += 180;
      angle += d * 0.3;
    }
    // paranoia: a non-finite write would invalidate the whole transform and
    // drop the blob at 0,0 — freeze a frame instead
    if (!Number.isFinite(x + y + angle + hover + stretch)) {
      raf = requestAnimationFrame(loop);
      return;
    }
    const s = 1 + hover * 1.1;
    blob.style.transform =
      `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) ` +
      `rotate(${angle.toFixed(1)}deg) scale(${(s * (1 + stretch)).toFixed(3)}, ${(s * (1 - stretch * 0.75)).toFixed(3)})`;

    // droplets while moving (faster = bigger drops)
    const now = performance.now();
    if (shown && speed > 1.2 && now - lastDrop > TRAIL_EVERY_MS) {
      lastDrop = now;
      drop(x, y, speed > 9);
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX;
    ty = e.clientY;
    if (!shown) {
      shown = true;
      blob.classList.add("cursor-blob--shown");
      x = tx;
      y = ty;
    }
    const t = e.target as Element | null;
    hoverTarget = t && "closest" in t && t.closest(INTERACTIVE) ? 1 : 0;
  });
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    blob.classList.add("cursor-blob--down");
    pop(e.clientX, e.clientY);
  });
  document.addEventListener("pointerup", () => blob.classList.remove("cursor-blob--down"));
  document.addEventListener("pointerleave", () => blob.classList.remove("cursor-blob--shown"));
  document.addEventListener("pointerenter", () => {
    if (shown) blob.classList.add("cursor-blob--shown");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      raf = requestAnimationFrame(loop);
    }
  });
}
