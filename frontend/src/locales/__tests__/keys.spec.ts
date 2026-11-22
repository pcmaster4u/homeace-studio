import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import de from "../de";
import en from "../en";

const SOURCE_DIR = join(__dirname, "..", "..");
/** t("a.b.c") or t('a.b.c') with a plain key; template keys like t(`kind.${x}`) are left out. */
const KEY_CALL = /\bt\(\s*["']([a-zA-Z][\w]*(?:\.[\w]+)+)["']/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return /\.(vue|ts)$/.test(name) ? [path] : [];
  });
}

function hasKey(messages: unknown, key: string): boolean {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object" || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string";
}

describe("translation keys", () => {
  it("exist in both languages for every fixed key the code uses", () => {
    const keys = new Set(
      sourceFiles(SOURCE_DIR).flatMap((file) =>
        [...readFileSync(file, "utf8").matchAll(KEY_CALL)].map((match) => match[1] ?? ""),
      ),
    );
    const missing = [...keys].filter((key) => !hasKey(de, key) || !hasKey(en, key)).sort();

    expect(keys.size).toBeGreaterThan(300);
    expect(missing).toEqual([]);
  });
});
