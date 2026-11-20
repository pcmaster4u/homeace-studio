/** All routes live under /api so the same server can serve the UI from / later. */
export const API_PREFIX = "api";

export const DEFAULT_PORT = 3000;

/** Local development reads the shared .env in the project root; the add-on has no .env file. */
export const LOCAL_ENV_FILE = "../.env";

export const APP_ENV = {
  port: "PORT",
  /** Folder with the built frontend. Set in the add-on image; unset locally (Vite serves the UI). */
  staticDir: "STATIC_DIR",
} as const;
