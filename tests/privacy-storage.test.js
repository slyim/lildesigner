import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { privacy } from "../src/data/legal.ts";

// The theme follows the OS setting (see index.astro: matchMedia, no manual
// toggle, and the old zelva-theme key is deleted, never written). The policy
// must not claim theme preferences are kept in storage.
describe("privacy policy storage disclosure", () => {
  const section = privacy.sections.find((s) => s.heading === "3. Local Storage");

  it("has a Local Storage section", () => {
    assert.ok(section, "expected a '3. Local Storage' section");
  });

  it("does not claim theme preferences are stored", () => {
    assert.doesNotMatch(section.body, /theme/i);
  });

  it("still discloses volume preference storage", () => {
    assert.match(section.body, /volume/i);
  });
});
