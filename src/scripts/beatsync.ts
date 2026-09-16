// Shared WebAudio beat engine: analyser taps + adaptive beat detection.
// One AudioContext for the page; each <audio> element gets a single
// MediaElementSource routed through its own AnalyserNode.

let ctx: AudioContext | null = null;
const taps = new WeakMap<HTMLMediaElement, AnalyserNode>();

export function getAudioContext(): AudioContext | null {
  if (ctx) return ctx;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

/** Route `audio` through an AnalyserNode (once per element). Null when WebAudio is unavailable. */
export function tapAnalyser(audio: HTMLAudioElement, fftSize = 1024): AnalyserNode | null {
  const hit = taps.get(audio);
  if (hit) return hit;
  const ac = getAudioContext();
  if (!ac) return null;
  if (ac.state === "suspended") void ac.resume();
  try {
    const analyser = ac.createAnalyser();
    analyser.fftSize = fftSize;
    // 1024-point FFT resolves the kick band (~43-47Hz/bin); lighter smoothing
    // keeps the attack transient the detector keys on instead of smearing it
    analyser.smoothingTimeConstant = 0.7;
    const src = ac.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(ac.destination);
    taps.set(audio, analyser);
    return analyser;
  } catch {
    return null;
  }
}

export interface Levels {
  bass: number;
  mid: number;
  high: number;
  energy: number;
}

function bandAvg(buf: Uint8Array, from: number, to: number): number {
  const end = Math.min(to, buf.length);
  if (from >= end) return 0;
  let sum = 0;
  for (let i = from; i < end; i++) sum += buf[i];
  return sum / ((end - from) * 255);
}

/**
 * fftSize 1024 -> 512 bins at ~43-47Hz each (44.1/48kHz). Bass is the
 * ~45-190Hz kick zone (bins 1-4, skipping the DC bin); mids run to ~2kHz,
 * highs to ~7.5kHz. The old 256-point mapping called bins 1-7 "bass", which
 * is ~170Hz-1.2kHz — low mids, so vocals and snares all read as beats.
 */
export function sampleLevels(analyser: AnalyserNode, buf: Uint8Array<ArrayBuffer>): Levels {
  analyser.getByteFrequencyData(buf);
  const bass = bandAvg(buf, 1, 5);
  const mid = bandAvg(buf, 5, 48);
  const high = bandAvg(buf, 48, 161);
  return { bass, mid, high, energy: bass * 0.55 + mid * 0.3 + high * 0.15 };
}

/**
 * Onset-driven beat detector. Level thresholds go deaf under sustained loud
 * bass (the drone inflates the average until kicks stop registering) and
 * twitch at every ripple when quiet — so this keys on weighted spectral
 * flux (frame-to-frame rises) against a trailing peak instead. Kicks punch
 * through any drone, and the broadband fallback keeps sparse piano tracks
 * breathing when the bass band is empty.
 */
export class BeatDetector {
  // explicit fields (not parameter properties) so node --experimental-strip-types
  // can import this for tests — parameter properties aren't erasable syntax
  private prevBass = 0;
  private prevMid = 0;
  private prevHigh = 0;
  private seeded = false;
  private past: { t: number; v: number }[] = [];
  private lastBeat = 0;
  private cooldownMs: number;
  private floor: number;
  private ratio: number;

  constructor(
    cooldownMs = 270,
    floor = 0.04,
    ratio = 0.55,
  ) {
    this.cooldownMs = cooldownMs;
    this.floor = floor;
    this.ratio = ratio;
  }

  update(bass: number, mid: number, high: number, now: number): { beat: boolean; strength: number } {
    if (!this.seeded) {
      // first frame has no "before" — seed it instead of firing one
      // spurious beat at full level
      this.prevBass = bass;
      this.prevMid = mid;
      this.prevHigh = high;
      this.seeded = true;
      return { beat: false, strength: 0 };
    }
    // rises only (falls are silence, not onsets); kick flux leads, mids and
    // highs ride along so kickless music still registers its attacks
    const flux =
      Math.max(0, bass - this.prevBass) +
      0.5 * Math.max(0, mid - this.prevMid) +
      0.3 * Math.max(0, high - this.prevHigh);
    this.prevBass = bass;
    this.prevMid = mid;
    this.prevHigh = high;
    // trailing peak excludes the freshest 120ms (the attack plus its
    // smoothing tail) so a beat can't raise the bar against itself
    const WINDOW_MS = 1500;
    const BLIND_MS = 120;
    while (this.past.length && now - this.past[0].t > WINDOW_MS) this.past.shift();
    let peak = 0;
    for (const p of this.past) {
      if (now - p.t >= BLIND_MS && p.v > peak) peak = p.v;
    }
    this.past.push({ t: now, v: flux });
    if (now - this.lastBeat < this.cooldownMs) return { beat: false, strength: 0 };
    const thresh = Math.max(this.floor, peak * this.ratio);
    if (flux > thresh) {
      this.lastBeat = now;
      // strength is the onset's size against recent peaks, so soft hits
      // flash softly and only the biggest hits flash fully; the floor term
      // keeps the range honest when there's no peak yet (fresh silence)
      const range = Math.max(peak - this.floor, 0.12);
      const strength = Math.min(1, (flux - this.floor) / range);
      return { beat: true, strength: 0.15 + 0.85 * strength };
    }
    return { beat: false, strength: 0 };
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

let syncRunning = false;

/**
 * Post-creation beat sync: pulses the `--beat-pulse` CSS var and drives the
 * music-pill EQ bars straight from the analyser. Safe to call once; the rAF
 * loop is self-throttling (auto-pauses in hidden tabs).
 *
 * Perf: every DOM write here runs 60x/sec, so values are quantized and the
 * EQ updates at half rate — visually identical, far fewer style recalcs.
 * Keep --beat-pulse readers composited (opacity/scale) outside tiny boxes:
 * a fullscreen `filter` reader would repaint every pixel, every frame.
 */
export function startBeatSync(audio: HTMLAudioElement) {
  if (syncRunning) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const analyser = tapAnalyser(audio, 1024);
  if (!analyser) return;
  syncRunning = true;
  document.body.classList.add("beatsync");

  const root = document.documentElement;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  const detector = new BeatDetector();
  const eq = [...document.querySelectorAll<HTMLElement>("#musicEq span")];
  let pulse = 0;
  let last = performance.now();
  let frame = 0;
  // last values written to the DOM — the loop runs forever, so skip writes
  // that wouldn't change anything (each one invalidates dependent styles)
  let lastPulse = "";
  const eqLast = ["", "", ""];

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frame++;
    if (!audio.paused && !audio.ended) {
      const lv = sampleLevels(analyser, buf);
      const { beat, strength } = detector.update(lv.bass, lv.mid, lv.high, now);
      if (beat) pulse = Math.min(1.15, Math.max(pulse, strength));
      // EQ at half rate: analyser smoothing carries the motion, 30Hz is plenty
      if (eq.length === 3 && frame % 2 === 0) {
        const vals = [
          clamp(0.2 + lv.bass * 2.0, 0.15, 1.0).toFixed(2),
          clamp(0.2 + lv.mid * 2.2, 0.15, 1.0).toFixed(2),
          clamp(0.2 + lv.high * 2.6, 0.15, 1.0).toFixed(2),
        ];
        for (let i = 0; i < 3; i++) {
          if (vals[i] !== eqLast[i]) {
            eq[i].style.transform = `scaleY(${vals[i]})`;
            eqLast[i] = vals[i];
          }
        }
      }
    }
    // fast decay: a full pulse clears within one cooldown window, so each
    // beat flashes at its own strength instead of piling onto the last one
    pulse = Math.max(0, pulse - dt * 3.5);
    // 2 decimals: 100 pulse steps look identical to 1000 but dedupe far more
    const pulseStr = pulse.toFixed(2);
    if (pulseStr !== lastPulse) {
      root.style.setProperty("--beat-pulse", pulseStr);
      lastPulse = pulseStr;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
