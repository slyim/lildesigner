// GSAP entrance choreography for the profile card.
// Plays once when the click-to-enter gate lifts. Uses `from` tweens with
// cleared props, so reduced-motion users simply see the final state.
//
// NOTE: never animate #view-profile or .profile-card itself — both feed the
// glass backdrop-filter, and animating transform/opacity on a backdrop-filter
// element flashes a white rectangle in Safari. Inner content only.
import { gsap } from "gsap";

let played = false;

const TARGETS = [
  "#view-profile .avatar-ring",
  "#view-profile .identity > *",
  "#view-profile .meta-item",
  "#view-profile .social",
  "#view-profile .legal",
].join(", ");

export function playEntrance() {
  if (played) return;
  played = true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!document.querySelector("#view-profile .profile-card")) return;
  const tl = gsap.timeline({
    defaults: { ease: "expo.out", duration: 0.6, clearProps: "transform,opacity" },
    delay: 0.15,
  });
  tl.from("#view-profile .avatar-ring", { scale: 0, duration: 0.7, ease: "back.out(1.7)" })
    .from("#view-profile .identity > *", { y: 18, opacity: 0, duration: 0.5, stagger: 0.07 }, "-=0.5")
    .from("#view-profile .meta-item", { y: 14, opacity: 0, duration: 0.45, stagger: 0.08 }, "-=0.4")
    .from("#view-profile .social", { y: 12, opacity: 0, scale: 0.6, duration: 0.4, stagger: 0.05 }, "-=0.35")
    .from("#view-profile .legal", { opacity: 0, duration: 0.4 }, "-=0.3");
  // Safety net: if the timeline ever dies mid-flight, never leave content stuck invisible.
  gsap.delayedCall(3, () => gsap.set(TARGETS, { clearProps: "transform,opacity" }));
}
