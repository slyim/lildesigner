// Card-creation ritual: from complete darkness the ACTUAL card builds itself
// in 3D while tilted at an angle — piece by piece, each one landing fully
// before the next begins (banner unfolds -> avatar flips in -> name tilts
// up -> stats flip in -> socials flip in -> legal fades) while product.mp3
// plays. Then BANG — the card swings around to face the viewer front and
// center as the blackhole ignites behind it, with a strobe, shockwave, and
// shake all landing on the same tick. The card itself never leaves the
// screen: no takeover, no gap, no stutter.
//
// After the bang product keeps playing over the blackhole background for a
// while; the caller hands it to the playlist and starts beat sync.
//
// NOTE: like entrance.ts, never animate #view-profile or .profile-card with
// GSAP — both feed the glass backdrop-filter, which flashes white in Safari
// when the filtered element itself is tweened. Inner content + WAAPI only.

import { gsap } from "gsap";
import { tapAnalyser } from "./beatsync";

export interface CreationOptions {
  getVolume: () => number;
  /** product track source — creation presses play, the playlist owns the rest */
  src: string;
  /** backdrop source for the bang — buffered silently during the build */
  bgSrc: string;
  /** section start of `src` — creation seeks here before playing */
  start?: number;
}

const HOLD_MS = 700;
const BANG_HOLD_MS = 1100;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const ALL_TARGETS = [
  "#view-profile .banner",
  "#view-profile .avatar-ring",
  "#view-profile .identity > *",
  "#view-profile .meta-item",
  "#view-profile .social",
  "#view-profile .legal",
].join(", ");

/** build angle — must match `body.creating #view-profile` in creation.css */
const BUILD_TILT = "rotateY(-28deg) rotateX(6deg) translateX(40px) scale(0.94)";

async function bang(getVolume: () => number) {
  const white = document.getElementById("flashWhite")!;
  const shock = document.getElementById("shockwave")!;
  const scene = document.getElementById("view-profile")!;
  const main = document.querySelector<HTMLElement>("main");
  const bgVideo = document.getElementById("bgVideo") as HTMLVideoElement | null;

  // don't fire until the backdrop has a frame ready to paint — the finished
  // card simply holds meanwhile, so a slow network delays the beat, never
  // shows a gap
  if (bgVideo && bgVideo.readyState < 2) {
    await Promise.race([
      new Promise<void>((res) => bgVideo.addEventListener("canplay", () => res(), { once: true })),
      wait(600),
    ]);
  }

  // BANG — everything on the same tick. The glass's one re-raster hides
  // behind the strobe at full white.
  document.body.classList.add("entered");
  document.body.classList.remove("creating", "no-glass");
  try {
    const p = bgVideo?.play();
    if (p) p.catch(() => {});
  } catch { /* caller retries on handoff */ }
  gsap.fromTo(white, { opacity: 0.95 }, { opacity: 0, duration: 0.35, ease: "expo.out" });
  // viewport-sized ring: scale(9) on the 140px disc spans 1260px — fine on a
  // laptop, but on a 2k monitor it fades out mid-screen and the bang reads as
  // a hiccup. Size the diameter to clear the longest edge with margin.
  const shockScale = Math.max(9, (Math.max(window.innerWidth, window.innerHeight) / 140) * 1.15);
  const shockDur = Math.round(900 + shockScale * 25);
  const shockAnim = shock.animate(
    [
      { opacity: 1, transform: "scale(0.15)" },
      { opacity: 0, transform: `scale(${shockScale.toFixed(1)})` },
    ],
    { duration: shockDur, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
  );
  // swing to the middle: the tilted card sweeps around to face the viewer,
  // overshooting a hair past frontal before settling. Same function order +
  // units in every keyframe so WAAPI interpolates instead of snapping.
  const land = scene.animate(
    [
      { transform: BUILD_TILT },
      { transform: "rotateY(3deg) rotateX(-1.5deg) translateX(-6px) scale(1.015)", offset: 0.6 },
      { transform: "rotateY(0deg) rotateX(0deg) translateX(0px) scale(1)" },
    ],
    { duration: 900, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
  );

  // shake burst (standalone `translate` never fights main's transitions)
  if (main) {
    const shakeStart = performance.now();
    const shake = () => {
      const t = (performance.now() - shakeStart) / 650;
      if (t >= 1) {
        main.style.translate = "";
        return;
      }
      const mag = (1 - t) * (1 - t) * 22 * getVolume() + (1 - t) * 4;
      main.style.translate = `${((Math.random() * 2 - 1) * mag).toFixed(1)}px ${((Math.random() * 2 - 1) * mag).toFixed(1)}px`;
      requestAnimationFrame(shake);
    };
    requestAnimationFrame(shake);
  }

  await wait(Math.max(BANG_HOLD_MS, shockDur));
  shockAnim.cancel();
  try {
    await land.finished;
  } catch { /* interrupted */ }
  land.cancel();
}

export async function playCreationSequence(opts: CreationOptions): Promise<void> {
  const scene = document.getElementById("view-profile");
  const audio = document.getElementById("bgMusic") as HTMLAudioElement | null;
  const bgVideo = document.getElementById("bgVideo") as HTMLVideoElement | null;
  if (!scene || !audio) return;
  if (!document.querySelector("#view-profile .profile-card")) return;
  // glass off for the assembly (see .no-glass) — restored under the strobe
  document.body.classList.add("no-glass");
  // freeze the hidden backdrop video, and point it at the bang footage now
  // so it has the whole build to buffer while paused
  try {
    bgVideo?.pause();
    if (bgVideo && bgVideo.getAttribute("src") !== opts.bgSrc) {
      bgVideo.setAttribute("src", opts.bgSrc);
      bgVideo.load();
    }
  } catch { /* backdrop keeps its current footage */ }

  // product.mp3 drives the build (and keeps playing after the reveal).
  // Volume is owned by the playlist section logic in index.astro (timeupdate).
  audio.src = opts.src;
  // tap the beat-sync analyser BEFORE first play: attaching a
  // MediaElementSource to an already-playing element reroutes live audio
  // with an audible clip. startBeatSync later reuses this same tap.
  tapAnalyser(audio, 1024);
  // metadata isn't in yet, so a bare currentTime assignment throws — hook it
  const startAt = opts.start ?? 0;
  if (startAt > 0) {
    const seek = () => {
      try { audio.currentTime = startAt; } catch { /* keep 0 */ }
      audio.removeEventListener("loadedmetadata", seek);
    };
    audio.addEventListener("loadedmetadata", seek);
  }
  try {
    await audio.play();
  } catch { /* blocked: the build still plays, music starts on user toggle */ }

  // lift the black: the build emerges from complete darkness as the music starts
  document.getElementById("creation")?.classList.add("creation--lifted");

  // hide every component, then assemble them one by one in 3D —
  // transformPerspective per tween keeps each flip round even though the
  // intermediate wrappers are flat. Strictly sequential: each piece lands
  // fully before the next begins (~7s build).
  gsap.set(ALL_TARGETS, { opacity: 0 });

  const tl = gsap.timeline();
  tl.fromTo(
    "#view-profile .banner",
    { rotationX: -75, y: -20, opacity: 0, transformOrigin: "50% 0%", transformPerspective: 900 },
    { rotationX: 0, y: 0, opacity: 1, duration: 0.9, ease: "expo.out" },
    1.0,
  );
  tl.fromTo(
    "#view-profile .avatar-ring",
    { rotationY: -180, scale: 0.4, opacity: 0, transformPerspective: 800 },
    { rotationY: 0, scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.2)" },
    ">+0.2",
  );
  tl.fromTo(
    "#view-profile .identity > *",
    { rotationX: 55, y: 24, opacity: 0, transformOrigin: "50% 100%", transformPerspective: 900 },
    { rotationX: 0, y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.22 },
    ">+0.2",
  );
  tl.fromTo(
    "#view-profile .meta-item",
    { rotationY: 70, opacity: 0, transformPerspective: 800 },
    { rotationY: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.12 },
    ">+0.2",
  );
  tl.fromTo(
    "#view-profile .social",
    { rotationX: -90, y: 8, opacity: 0, transformPerspective: 800 },
    { rotationX: 0, y: 0, opacity: 1, duration: 0.65, ease: "back.out(1.2)", stagger: 0.12 },
    ">+0.2",
  );
  tl.fromTo(
    "#view-profile .legal",
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
    ">+0.25",
  );

  try {
    await tl.then();
  } catch { /* interrupted */ }
  gsap.set(ALL_TARGETS, { clearProps: "transform,opacity" });
  await wait(HOLD_MS);

  // product keeps playing under the bang — the caller hands it to the playlist
  await bang(opts.getVolume);
}
