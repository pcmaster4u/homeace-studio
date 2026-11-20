import { describe, expect, it } from "vitest";

import { clampNumber } from "../number";

describe("clampNumber", () => {
  it("keeps values inside the range and moves others to the nearest bound", () => {
    expect(clampNumber(500, 300, 700)).toBe(500);
    expect(clampNumber(812, 300, 700)).toBe(700);
    expect(clampNumber(120, 300, 700)).toBe(300);
  });

  it("returns min for NaN and when max is below min", () => {
    expect(clampNumber(Number.NaN, 300, 700)).toBe(300);
    expect(clampNumber(500, 300, 200)).toBe(300);
  });
});
