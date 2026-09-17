import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { equalityIndex, bucketOf } from "../src/data/equalityIndex.ts";

// Guards the Equaldex transcription (World Equality Index, Sep 2026):
// 197 ranked countries, integer scores 0-100, every ISO present in
// world.svg. The About tab shows the map with no surrounding context.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgIds = new Set(
  [...readFileSync(join(root, "public/world.svg"), "utf8").matchAll(/id="([A-Z-]{2,6})"/g)].map((m) => m[1]),
);
const about = readFileSync(join(root, "src/components/AboutCard.astro"), "utf8");

describe("world equality map", () => {
  it("holds 197 integer scores from 0 to 100", () => {
    const entries = Object.entries(equalityIndex);
    assert.equal(entries.length, 197);
    for (const [iso, score] of entries) {
      assert.match(iso, /^[A-Z]{2}$/, `${iso} is not an ISO-2 code`);
      assert.equal(Number.isInteger(score), true, `${iso} score ${score} is not an integer`);
      assert.ok(score >= 0 && score <= 100, `${iso} score ${score} out of range`);
    }
  });

  it("matches Equaldex's top and bottom of the ranking", () => {
    assert.equal(equalityIndex["IS"], 93);
    assert.equal(equalityIndex["AF"], 1);
  });

  it("maps every ranked country onto a path in world.svg", () => {
    const missing = Object.keys(equalityIndex).filter((iso) => !svgIds.has(iso));
    assert.equal(missing.length, 0, `no SVG path for: ${missing.join(", ")}`);
  });

  it("quantizes scores into buckets 0-9", () => {
    assert.equal(bucketOf(0), 0);
    assert.equal(bucketOf(9), 0);
    assert.equal(bucketOf(10), 1);
    assert.equal(bucketOf(93), 9);
    assert.equal(bucketOf(100), 9);
  });

  it("renders the map with no surrounding context", () => {
    assert.doesNotMatch(about, /world-caption|world-legend|world-src/);
    assert.match(about, /id="worldMapSlot"/);
  });
});
