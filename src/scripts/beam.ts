// Exactly-one hover target: only the deepest hovered element gets .beaming,
// so hovering a button inside a card doesn't also light up the card.
// All hover animations (border beams, pulses) trigger on .beaming.

const HOVER_SELECTOR =
  ".glass-card, .social, .float-pill, .meta-item, .avatar-ring, .pill-btn, .tab, .legal button, .legal-back, .legal-icon, .vol-slider, .comment-action";

export function initHoverGlow() {
  let current: Element | null = null;
  const setBeaming = (next: Element | null) => {
    if (next === current) return;
    current?.classList.remove("beaming");
    current = next;
    current?.classList.add("beaming");
  };
  document.addEventListener("pointerover", (e) => {
    const t = e.target as Element | null;
    setBeaming(t && "closest" in t ? t.closest(HOVER_SELECTOR) : null);
  });
  document.addEventListener("pointerout", (e) => {
    if (!(e as PointerEvent).relatedTarget) setBeaming(null);
  });
  document.addEventListener("pointercancel", () => setBeaming(null));
  // taps fake a hover on touch — clear it on release so glows never stick
  document.addEventListener("pointerup", (e) => {
    if ((e as PointerEvent).pointerType !== "mouse") setBeaming(null);
  });
}
