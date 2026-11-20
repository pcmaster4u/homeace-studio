import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

/**
 * Version shown in the settings. Image builds pass BUILD_VERSION (the HA Supervisor does it for a
 * local app, the GitHub workflow for releases); during development it comes from the app's
 * config.yaml next to this folder.
 */
function appVersion(): string {
  if (process.env.BUILD_VERSION) return process.env.BUILD_VERSION;

  try {
    const config = readFileSync(new URL("../homeace-studio/config.yaml", import.meta.url), "utf8");
    return /^version:\s*"?([^"\r\n]+)"?/m.exec(config)?.[1] ?? "dev";
  } catch {
    return "dev";
  }
}

/** Local NestJS backend (backend/, `npm run start:dev`). */
const BACKEND_URL = "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths: behind HA ingress the app lives under a changing prefix
  // (/api/hassio_ingress/<token>/), so absolute paths like /assets/... would miss.
  base: "./",
  plugins: [vue(), vueDevTools()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    // The backend keeps the /api prefix itself, so no path rewrite.
    proxy: {
      "/api": { target: BACKEND_URL, changeOrigin: true },
    },
  },
});
