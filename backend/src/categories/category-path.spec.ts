import { isSameOrBelow, normalizeCategoryPath, replacePathPrefix } from "./category-path";

describe("normalizeCategoryPath", () => {
  it("trims every level", () => {
    expect(normalizeCategoryPath(" Haus / Terrasse ")).toBe("Haus/Terrasse");
  });

  it("rejects empty levels", () => {
    expect(normalizeCategoryPath("")).toBeNull();
    expect(normalizeCategoryPath("Haus//Terrasse")).toBeNull();
    expect(normalizeCategoryPath("Haus/ ")).toBeNull();
  });
});

describe("isSameOrBelow", () => {
  it("compares whole levels", () => {
    expect(isSameOrBelow("Haus", "Haus")).toBe(true);
    expect(isSameOrBelow("Haus/Terrasse", "Haus")).toBe(true);
    expect(isSameOrBelow("Hausflur", "Haus")).toBe(false);
  });
});

describe("replacePathPrefix", () => {
  it("swaps the leading part and keeps the rest", () => {
    expect(replacePathPrefix("Haus/Terrasse/Licht", "Haus", "Heim")).toBe("Heim/Terrasse/Licht");
    expect(replacePathPrefix("Haus", "Haus", "Heim")).toBe("Heim");
  });
});
