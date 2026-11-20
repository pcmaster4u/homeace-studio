import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { EMPTY_OVERLAY } from "../overlay.model";
import { FileOverlayRepository } from "./file-overlay.repository";

describe("FileOverlayRepository", () => {
  let folder: string;
  let filePath: string;

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), "homeace-overlay-"));
    filePath = join(folder, "nested", "overlay.json");
  });

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it("returns an empty overlay when the file does not exist yet", async () => {
    const repository = new FileOverlayRepository(filePath);

    await expect(repository.read()).resolves.toEqual(EMPTY_OVERLAY);
  });

  it("creates the folder and writes the changed overlay", async () => {
    const repository = new FileOverlayRepository(filePath);

    await repository.update((overlay) => ({ ...overlay, ownedCategoryIds: ["cat-1"] }));

    const stored = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    expect(stored).toEqual({ ...EMPTY_OVERLAY, ownedCategoryIds: ["cat-1"] });
  });

  it("runs concurrent updates one after another, so none gets lost", async () => {
    const repository = new FileOverlayRepository(filePath);
    const addId = (id: string) =>
      repository.update((overlay) => ({
        ...overlay,
        ownedCategoryIds: [...overlay.ownedCategoryIds, id],
      }));

    await Promise.all([addId("a"), addId("b"), addId("c")]);

    const overlay = await repository.read();
    expect(overlay.ownedCategoryIds).toEqual(["a", "b", "c"]);
  });
});
