import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The blob cursor must never initialize on mobile: some phones and
// tablets report a hover capability, so the gate needs a fine primary
// pointer too — otherwise its rAF loop and cursor:none leak onto touch.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cursor = readFileSync(join(root, "src/scripts/cursor.ts"), "utf8");

describe("blob cursor gating", () => {
  it("requires hover AND a fine primary pointer before initializing", () => {
    assert.match(cursor, /\(hover: hover\) and \(pointer: fine\)/);
  });
});
