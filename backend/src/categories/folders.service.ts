import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { apiError } from "src/common/api/api-response";
import { MESSAGE_ID } from "src/messages/message-ids";
import { OVERLAY_REPOSITORY } from "../overlay/overlay.constants";
import type { OverlayRepository } from "../overlay/repositories/overlay.repository";
import { requireCategoryPath } from "./require-category-path";

export type FolderOverview = {
  /** Empty folders the user created, e.g. "Haus/Pool". */
  saved: string[];
  /** Folder path → "#rrggbb". */
  colors: Record<string, string>;
};

/**
 * Empty folders the user creates in the tree. HA gets no category for them (no empty categories);
 * the HA category appears automatically when the first entry moves in.
 */
@Injectable()
export class FoldersService {
  constructor(@Inject(OVERLAY_REPOSITORY) private readonly overlay: OverlayRepository) {}

  /** Saved empty folders (sorted) and the color of every folder that has one. */
  async findAll(): Promise<FolderOverview> {
    const overlay = await this.overlay.read();
    const saved = [...overlay.folders].sort((first, second) =>
      first.localeCompare(second, undefined, { sensitivity: "base" }),
    );

    return { saved, colors: overlay.folderColors };
  }

  /**
   * Gives a folder its own color (only in the overlay; HA categories have no color).
   *
   * @param color - "#rrggbb", or null to go back to the default.
   */
  async setColor(path: string, color: string | null): Promise<void> {
    const folder = requireCategoryPath(path);

    await this.overlay.update((overlay) => {
      const folderColors = { ...overlay.folderColors };

      if (color === null) {
        delete folderColors[folder];
      } else {
        folderColors[folder] = color;
      }

      return { ...overlay, folderColors };
    });
  }

  /** @returns The normalized path, e.g. "Haus/Pool" for " Haus / Pool ". */
  async create(path: string): Promise<string> {
    const folder = requireCategoryPath(path);
    const overlay = await this.overlay.read();

    if (overlay.folders.includes(folder)) {
      throw new ConflictException(apiError(MESSAGE_ID.folderExists, { params: { path: folder } }));
    }

    await this.overlay.update((current) => ({ ...current, folders: [...current.folders, folder] }));

    return folder;
  }

  /** Forgets an empty folder. HA categories are not touched; they disappear with their last entry. */
  async delete(path: string): Promise<void> {
    const folder = requireCategoryPath(path);
    const overlay = await this.overlay.read();

    if (!overlay.folders.includes(folder)) {
      throw new NotFoundException(
        apiError(MESSAGE_ID.folderNotFound, { params: { path: folder } }),
      );
    }

    await this.overlay.update((current) => ({
      ...current,
      folders: current.folders.filter((item) => item !== folder),
    }));
    await this.setColor(folder, null);
  }
}
