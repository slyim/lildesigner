// Subtle floating dot particles inside the profile card.
// A few dozen tiny slow-drifting dots on a DPR-aware canvas: one cheap
// rAF loop, paused when hidden/offscreen, off for reduced-motion users.

interface Dot {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  alpha: number;
  pink: boolean;
}

export function initCardParticles() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const card = document.querySelector<HTMLElement>("#view-profile .profile-card");
  if (!card) return;

  const canvas = document.createElement("canvas");
  canvas.className = "card-particles";
  canvas.setAttribute("aria-hidden", "true");
  // Layout-critical styles live here, not in scoped CSS: Astro scopes
  // component styles via data attributes that JS-created elements never get,
  // and an unconstrained canvas feeds back into the ResizeObserver loop below.
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "6";
  canvas.style.pointerEvents = "none";
  card.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  // const aliases: narrowing on `card`/`ctx` doesn't survive into the
  // rAF + observer closures below
  const el = card;
  const g = ctx;

  let w = 0;
  let h = 0;
  let dots: Dot[] = [];
  let raf = 0;
  let running = false;
  let visible = true;
  // small screens = weak GPUs: fewer dots, coarser canvas, half rate.
  // Re-evaluated on resize so rotation/dragging across monitors adapts.
  let lowPower = false;

  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  function seed() {
    const base = Math.min(48, Math.max(20, (w * h) / 9000));
    const count = Math.round(lowPower ? base / 2 : base);
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(0.7, 2.2),
      vx: rand(-4, 4),
      vy: rand(-10, -3),
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.4, 1.1),
      alpha: rand(0.12, 0.45),
      pink: Math.random() < 0.35,
    }));
  }

  function resize() {
    const rect = el.getBoundingClientRect();
    lowPower = window.matchMedia("(max-width: 768px)").matches;
    const dpr = Math.min(lowPower ? 1.5 : 2, window.devicePixelRatio || 1);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  let last = 0;
  function frame(t: number) {
    if (!running) return;
    // low-power: every other frame. Drift is slow; 30fps reads the same,
    // and dt below keeps the motion speed exact.
    if (lowPower && last !== 0 && t - last < 33) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    g.clearRect(0, 0, w, h);
    for (const d of dots) {
      d.phase += dt * d.speed;
      d.x += (d.vx + Math.sin(d.phase) * 6) * dt;
      d.y += d.vy * dt;
      if (d.y < -6) {
        d.y = h + 6;
        d.x = Math.random() * w;
      }
      if (d.x < -6) d.x = w + 6;
      else if (d.x > w + 6) d.x = -6;
      const tw = d.alpha * (0.6 + 0.4 * Math.sin(d.phase * 1.7));
      g.beginPath();
      g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      g.fillStyle = d.pink
        ? `rgba(255, 170, 225, ${tw.toFixed(3)})`
        : `rgba(255, 255, 255, ${tw.toFixed(3)})`;
      g.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  function setRunning(on: boolean) {
    on = on && visible && !document.hidden;
    if (on === running) return;
    running = on;
    if (running) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
    }
  }

  // viewport-only resizes (desktop window drag) don't change the card's box,
  // so the observer below wouldn't fire — watch the breakpoint directly too
  window.matchMedia("(max-width: 768px)").addEventListener("change", resize);
  new ResizeObserver(resize).observe(card);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    setRunning(true);
  }).observe(card);
  document.addEventListener("visibilitychange", () => setRunning(true));
  resize();
  setRunning(true);
}
