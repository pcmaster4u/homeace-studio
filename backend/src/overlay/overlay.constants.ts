export const OVERLAY_REPOSITORY = Symbol("OVERLAY_REPOSITORY");
export const OVERLAY_FILE_PATH = Symbol("OVERLAY_FILE_PATH");

export const OVERLAY_ENV = {
  /** In the add-on: /config/overlay.json (the add-on config folder, part of HA backups). */
  file: "OVERLAY_FILE",
} as const;

/** Local development: next to the project root, git-ignored. */
export const DEFAULT_OVERLAY_FILE = "../data/overlay.json";
