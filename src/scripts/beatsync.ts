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
export function tapAnalyser(audio: HTMLAudioElement, fftSize = 256): AnalyserNode | null {
  const hit = taps.get(audio);
  if (hit) return hit;
  const ac = getAudioContext();
  if (!ac) return null;
  if (ac.state === "suspended") void ac.resume();
  try {
    const analyser = ac.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0.82;
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

/** fftSize 256 -> 128 bins. Bass ~ bins 1-7, mids 8-32, highs 33-96. */
export function sampleLevels(analyser: AnalyserNode, buf: Uint8Array<ArrayBuffer>): Levels {
  analyser.getByteFrequencyData(buf);
  const bass = bandAvg(buf, 1, 8);
  const mid = bandAvg(buf, 8, 33);
  const high = bandAvg(buf, 33, 97);
  return { bass, mid, high, energy: bass * 0.55 + mid * 0.3 + high * 0.15 };
}

/** Adaptive threshold beat detector over the bass band. */
export class BeatDetector {
  private history: number[] = [];
  private lastBeat = 0;

  constructor(
    private windowSize = 43,
    private threshold = 1.32,
    private cooldownMs = 270,
    private floor = 0.07,
  ) {}

  update(bass: number, now: number): { beat: boolean; strength: number } {
    const h = this.history;
    const avg = h.length ? h.reduce((a, b) => a + b, 0) / h.length : bass;
    h.push(bass);
    if (h.length > this.windowSize) h.shift();
    if (now - this.lastBeat < this.cooldownMs) return { beat: false, strength: 0 };
    const thresh = Math.max(avg * this.threshold, this.floor);
    if (bass > thresh) {
      this.lastBeat = now;
      const strength = Math.min(1, (bass - thresh) / Math.max(0.08, thresh));
      return { beat: true, strength: 0.45 + 0.55 * strength };
    }
    return { beat: false, strength: 0 };
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

let syncRunning = false;

/**
 * Post-creation beat sync: pulses `--beat` / `--beat-pulse` CSS vars and drives
 * the music-pill EQ bars straight from the analyser. Safe to call once; the
 * rAF loop is self-throttling (auto-pauses in hidden tabs).
 */
export function startBeatSync(audio: HTMLAudioElement) {
  if (syncRunning) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const analyser = tapAnalyser(audio, 256);
  if (!analyser) return;
  syncRunning = true;
  document.body.classList.add("beatsync");

  const root = document.documentElement;
  const buf = new Uint8Array(analyser.frequencyBinCount);
  const detector = new BeatDetector();
  const eq = [...document.querySelectorAll<HTMLElement>("#musicEq span")];
  let pulse = 0;
  let last = performance.now();
  // last values written to the DOM — the loop runs forever, so skip writes
  // that wouldn't change anything (each one invalidates dependent styles)
  let lastBeat = "";
  let lastPulse = "";
  const eqLast = ["", "", ""];

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!audio.paused && !audio.ended) {
      const lv = sampleLevels(analyser, buf);
      const { beat, strength } = detector.update(lv.bass, now);
      if (beat) pulse = Math.min(1.15, Math.max(pulse, strength));
      const beatStr = lv.energy.toFixed(3);
      if (beatStr !== lastBeat) {
        root.style.setProperty("--beat", beatStr);
        lastBeat = beatStr;
      }
      if (eq.length === 3) {
        const vals = [
          clamp(0.2 + lv.bass * 2.0, 0.15, 1.0).toFixed(3),
          clamp(0.2 + lv.mid * 2.2, 0.15, 1.0).toFixed(3),
          clamp(0.2 + lv.high * 2.6, 0.15, 1.0).toFixed(3),
        ];
        for (let i = 0; i < 3; i++) {
          if (vals[i] !== eqLast[i]) {
            eq[i].style.transform = `scaleY(${vals[i]})`;
            eqLast[i] = vals[i];
          }
        }
      }
    }
    pulse = Math.max(0, pulse - dt * 2.4);
    const pulseStr = pulse.toFixed(3);
    if (pulseStr !== lastPulse) {
      root.style.setProperty("--beat-pulse", pulseStr);
      lastPulse = pulseStr;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
