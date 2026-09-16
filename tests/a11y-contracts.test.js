import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Accessibility contracts for the audit fixes. The repo has no DOM harness
// (and must not gain a framework for this), so these assert the declarative
// contracts in the real component sources: each one failed before its fix
// and guards the attribute/handler against future removal.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const index = read("src/pages/index.astro");
const comments = read("src/scripts/comments.ts");
const profile = read("src/components/ProfileCard.astro");
const legal = read("src/components/LegalCard.astro");
const modals = read("src/components/CommentsModals.astro");
const about = read("src/components/AboutCard.astro");

describe("a11y contracts", () => {
  it("parks pre-enter content inert so Tab cannot reach it behind the gate", () => {
    assert.match(index, /<main[^>]*inert[>\s]/);
    assert.match(index, /id="musicPill"[^>]*inert/);
    assert.match(index, /id="tabbar"[^>]*inert/);
    assert.equal((index.match(/removeAttribute\("inert"\)/g) ?? []).length, 3);
  });

  it("moves focus to content when the gate is dismissed", () => {
    assert.match(index, /enter\.addEventListener\("click"[\s\S]{0,2000}\.focus\(/);
  });

  it("gives the icon-only player buttons accessible names", () => {
    for (const id of ["prevBtn", "musicToggle", "nextBtn"]) {
      const tag = index.match(new RegExp(`<button[^>]*id="${id}"[^>]*>`, "s"))?.[0] ?? "";
      assert.match(tag, /aria-label="/, `${id} needs aria-label`);
    }
    assert.match(index, /setPlayingUI[\s\S]{0,400}aria-label/);
  });

  it("hides decorative phosphor icons from assistive tech", () => {
    for (const [name, src] of [["index", index], ["ProfileCard", profile], ["LegalCard", legal], ["CommentsModals", modals]]) {
      const exposed = [...src.matchAll(/<i\s+class="[^"]*"[^>]*>/g)]
        .map((m) => m[0])
        .filter((t) => !/aria-hidden="true"/.test(t));
      assert.equal(exposed.length, 0, `${name}: ${exposed.join(" | ")}`);
    }
  });

  it("shows keyboard focus on the volume slider and gate", () => {
    assert.match(index, /\.vol-slider:focus-visible/);
    assert.match(index, /\.enter:focus-visible/);
  });

  it("disables the like button when analytics are unavailable", () => {
    assert.match(index, /\.disabled\s*=\s*true/);
  });

  it("exposes like state via aria-pressed", () => {
    assert.match(profile, /aria-pressed="false"/);
    assert.match(index, /setAttribute\("aria-pressed", "true"\)/);
  });

  it("traps Tab focus inside open comment modals", () => {
    assert.match(comments, /e\.key === "Tab"/);
    assert.match(comments, /root\.inert = stack\.length > 0/);
  });

  it("marks same-page view switches with aria-current=true, not page", () => {
    assert.doesNotMatch(index, /aria-current="page"/);
    assert.match(index, /aria-current", "true"|aria-current="true"/);
  });

  it("wraps long words in free-text blocks", () => {
    assert.match(profile, /overflow-wrap/);
    assert.match(about, /overflow-wrap/);
  });
});
