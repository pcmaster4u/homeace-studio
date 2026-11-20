import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { Inject, Injectable } from "@nestjs/common";

import { OVERLAY_FILE_PATH } from "../overlay.constants";
import { EMPTY_OVERLAY, type Overlay } from "../overlay.model";
import type { OverlayRepository } from "./overlay.repository";

const FILE_NOT_FOUND = "ENOENT";
const TEMP_FILE_SUFFIX = ".tmp";
const JSON_INDENT = 2;

/** Keeps the overlay in one JSON file. No DB on purpose (see docs/decisions.md). */
@Injectable()
export class FileOverlayRepository implements OverlayRepository {
  /** Every update waits for the one before it. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(@Inject(OVERLAY_FILE_PATH) private readonly filePath: string) {}

  async read(): Promise<Overlay> {
    let raw: string;

    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === FILE_NOT_FOUND) {
        return structuredClone(EMPTY_OVERLAY);
      }

      throw error;
    }

    // Fields added in later versions get their defaults.
    return { ...structuredClone(EMPTY_OVERLAY), ...(JSON.parse(raw) as Partial<Overlay>) };
  }

  update(change: (overlay: Overlay) => Overlay): Promise<Overlay> {
    const next = this.queue.then(async () => {
      const changed = change(await this.read());
      await this.write(changed);

      return changed;
    });

    // A failed update must not block the ones after it.
    this.queue = next.catch(() => undefined);

    return next;
  }

  /** Writes to a temp file first and renames it, so a crash never leaves half a file. */
  private async write(overlay: Overlay): Promise<void> {
    const tempPath = this.filePath + TEMP_FILE_SUFFIX;

    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(tempPath, JSON.stringify(overlay, null, JSON_INDENT) + "\n", "utf8");
    await rename(tempPath, this.filePath);
  }
}
