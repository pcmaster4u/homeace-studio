export const OVERLAY_VERSION = 1;

/** Own extras that HA never sees. Grows with favorites, notes, colors, … */
export type Overlay = {
  version: typeof OVERLAY_VERSION;
  /**
   * HA categories HomeAce Studio created itself. Only these are deleted automatically when they
   * become empty; categories the user made in HA are never touched.
   */
  ownedCategoryIds: string[];
  /**
   * Folders the user created in the tree, e.g. "Haus/Pool". HA has no empty categories, so a folder
   * without entries lives only here; it stays until the user deletes it.
   */
  folders: string[];
  /** Entity IDs the user marked as favorites. */
  favorites: string[];
  /** Free notes per entity ID. */
  notes: Record<string, string>;
  /** Color per folder path, as "#rrggbb". */
  folderColors: Record<string, string>;
  /** Clean-up proposals the user hid ("split:Büro - Licht", "merge:Routine|Routinen"). */
  cleanupIgnored: string[];
};

export const EMPTY_OVERLAY: Overlay = {
  version: OVERLAY_VERSION,
  ownedCategoryIds: [],
  folders: [],
  favorites: [],
  notes: {},
  folderColors: {},
  cleanupIgnored: [],
};
