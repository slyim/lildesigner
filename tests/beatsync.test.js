import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BeatDetector, sampleLevels } from "../src/scripts/beatsync.ts";

// Beat-detection quality: the fullscreen flash fires off this detector, so
// false positives read as screen flicker. These drive the REAL BeatDetector
// and sampleLevels (pure logic, explicit timestamps — fully deterministic).

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

/** Feed steady levels so onset state settles, advancing a fake clock. */
function settle(detector, { bass = 0, mid = 0, high = 0 }, frames = 60, start = 10000) {
  let now = start;
  for (let i = 0; i < frames; i++) {
    detector.update(bass, mid, high, now);
    now += 16;
  }
  return now;
}

/** spectrum mock: energy only in [from, to), byte-scale like getByteFrequencyData. */
function mockAnalyser(size, from, to, value = 200) {
  return {
    frequencyBinCount: size,
    getByteFrequencyData(buf) {
      buf.fill(0);
      for (let i = from; i < Math.min(to, buf.length); i++) buf[i] = value;
    },
  };
}

describe("beat detector", () => {
  it("fires on a kick-like bass onset after a quiet stretch", () => {
    const d = new BeatDetector();
    const now = settle(d, { bass: 0.05 });
    const { beat, strength } = d.update(0.5, 0.1, 0.1, now + 300);
    assert.equal(beat, true);
    assert.ok(strength > 0 && strength <= 1, `strength ${strength} in (0,1]`);
  });

  it("stays silent on smooth low-level wander (no flicker in soft passages)", () => {
    const d = new BeatDetector();
    let now = 10000;
    // slow drift + tiny jitter, the honest model of a smoothed analyser
    // sitting on hiss — frame-to-frame change stays near zero
    for (let i = 0; i < 120; i++) {
      const v = 0.05 + 0.008 * Math.sin(i / 4) + ((i * 7919) % 7) / 5000;
      const { beat } = d.update(v, v * 0.8, v * 0.6, now);
      assert.equal(beat, false, `flicker at frame ${i} (level ${v})`);
      now += 16;
    }
  });

  it("keeps hearing kicks on top of sustained loud bass", () => {
    // level-threshold detectors adapt to the drone and go deaf ("none at
    // all at beats"); onsets still punch through it.
    const d = new BeatDetector();
    let now = settle(d, { bass: 0.5, mid: 0.3, high: 0.2 });
    let beats = 0;
    for (let k = 0; k < 4; k++) {
      now += 500;
      if (d.update(0.75, 0.35, 0.22, now).beat) beats++;
      for (let i = 0; i < 10; i++) {
        now += 16;
        d.update(0.5, 0.3, 0.2, now);
      }
    }
    assert.equal(beats, 4, `heard ${beats}/4 kicks over the drone`);
  });

  it("breathes on broadband onsets when the bass is quiet (sparse piano)", () => {
    // "lovely" has no kick drum — piano chords arrive in mids/highs only.
    const d = new BeatDetector();
    const now = settle(d, { bass: 0.03, mid: 0.1, high: 0.05 });
    const { beat } = d.update(0.03, 0.25, 0.12, now + 500);
    assert.equal(beat, true, "piano-like onset went unheard");
  });

  it("ignores tiny ripples on a steady level", () => {
    const d = new BeatDetector();
    const now = settle(d, { bass: 0.4, mid: 0.3, high: 0.2 });
    assert.equal(d.update(0.41, 0.3, 0.2, now + 300).beat, false);
  });

  it("gives marginal onsets a soft pulse, not a full flash", () => {
    const d = new BeatDetector();
    const now = settle(d, { bass: 0.3, mid: 0.1, high: 0.1 });
    const { beat, strength } = d.update(0.345, 0.1, 0.1, now + 300);
    assert.equal(beat, true);
    assert.ok(strength < 0.45, `borderline beat flashed at ${strength}`);
  });

  it("scales strength with onset size (softer hits flash softer)", () => {
    const d = new BeatDetector();
    let now = settle(d, { bass: 0.05, mid: 0.05, high: 0.05 });
    const big = d.update(0.5, 0.05, 0.05, now + 300);
    assert.equal(big.beat, true);
    // relax to baseline so the next hit is measured fresh
    now += 300;
    for (let i = 0; i < 20; i++) {
      now += 16;
      d.update(0.05, 0.05, 0.05, now);
    }
    const mid = d.update(0.33, 0.05, 0.05, now + 16);
    assert.equal(mid.beat, true);
    assert.ok(big.strength >= 0.9, `big hit flashed at ${big.strength}`);
    assert.ok(mid.strength > 0.5, `mid-size hit crushed to ${mid.strength}`);
    assert.ok(mid.strength < big.strength, "no gradation between hits");
  });

  it("respects the cooldown between back-to-back onsets", () => {
    const d = new BeatDetector();
    const now = settle(d, { bass: 0.05 });
    assert.equal(d.update(0.6, 0.2, 0.2, now + 300).beat, true);
    assert.equal(d.update(0.65, 0.2, 0.2, now + 400).beat, false);
  });
});

describe("bass band isolation", () => {
  it("reads kick-zone bins as bass, low-mid bleed as mid (not bass)", () => {
    // fftSize 1024 -> 512 bins at ~43-47Hz each: bins 1-4 are the ~45-190Hz
    // kick zone; bins 5+ are mids. Old mapping called bins 1-7 "bass",
    // so every loud vocal/snare looked like a beat.
    const kick = sampleLevels(mockAnalyser(512, 1, 5), new Uint8Array(512));
    assert.ok(kick.bass > 0.5, `kick bass ${kick.bass}`);
    const lowMid = sampleLevels(mockAnalyser(512, 5, 8), new Uint8Array(512));
    assert.ok(lowMid.bass < 0.05, `low-mid leaked ${lowMid.bass} into bass`);
    assert.ok(lowMid.mid > 0.05, `low-mid mid ${lowMid.mid}`);
  });

  it("ignores sub-bass DC and airy top bins", () => {
    const dc = sampleLevels(mockAnalyser(512, 0, 1), new Uint8Array(512));
    assert.ok(dc.bass < 0.05, `DC bin leaked ${dc.bass} into bass`);
    const air = sampleLevels(mockAnalyser(512, 300, 512), new Uint8Array(512));
    assert.ok(air.bass < 0.05 && air.mid < 0.05, "top bins leaked down");
  });
});

describe("analyser wiring", () => {
  it("taps at fftSize 1024 with snappy smoothing for onset detection", () => {
    // coarse 256-point FFTs can't resolve a kick band at all (~172Hz/bin),
    // and heavy smoothing smears the attack the detector keys on.
    const beatsync = read("src/scripts/beatsync.ts");
    const creation = read("src/scripts/creation.ts");
    assert.match(beatsync, /tapAnalyser\(audio, 1024\)/);
    assert.match(creation, /tapAnalyser\(audio, 1024\)/);
    assert.match(beatsync, /smoothingTimeConstant = 0\.7/);
  });
});
