// Typewriter effect for the profile display name.
// The full name ships in the HTML, so no-JS users and screen readers see it
// as-is; playNameTyping() clears it and re-types it once the enter gate lifts,
// then occasionally erases and re-types it again to keep the card feeling alive.

let played = false;

const REWRITE_MIN_DELAY = 6000;
const REWRITE_JITTER = 9000;
const ERASE_MIN_TICK = 28;
const ERASE_JITTER = 32;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function typeName(el: HTMLElement, full: string, onDone: () => void) {
  let i = 0;
  const tick = () => {
    if (!el.isConnected) return;
    i++;
    el.textContent = full.slice(0, i);
    if (i < full.length) {
      setTimeout(tick, 90 + Math.random() * 90);
    } else {
      onDone();
    }
  };
  setTimeout(tick, 350);
}

function eraseName(el: HTMLElement, onDone: () => void) {
  const tick = () => {
    if (!el.isConnected) return;
    const current = el.textContent ?? "";
    if (current.length === 0) {
      onDone();
      return;
    }
    el.textContent = current.slice(0, -1);
    setTimeout(tick, ERASE_MIN_TICK + Math.random() * ERASE_JITTER);
  };
  setTimeout(tick, 350);
}

function scheduleRewrite(el: HTMLElement, full: string) {
  const delay = REWRITE_MIN_DELAY + Math.random() * REWRITE_JITTER;
  setTimeout(() => {
    if (!el.isConnected) return;
    if (prefersReducedMotion()) return;
    // Don't rewrite while the tab is hidden — wait for a visible moment.
    if (document.hidden) {
      scheduleRewrite(el, full);
      return;
    }
    eraseName(el, () => {
      if (!el.isConnected) return;
      // Brief pause on the empty name before re-typing.
      setTimeout(() => {
        if (!el.isConnected) return;
        typeName(el, full, () => scheduleRewrite(el, full));
      }, 450);
    });
  }, delay);
}

export function playNameTyping(root: ParentNode = document) {
  if (played) return;
  played = true;
  const el = root.querySelector<HTMLElement>("[data-typing-text]");
  if (!el) return;
  const full = el.textContent ?? "";
  if (!full) return;
  if (prefersReducedMotion()) return;
  el.textContent = "";
  typeName(el, full, () => scheduleRewrite(el, full));
}
