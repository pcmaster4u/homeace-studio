import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

/** Local NestJS backend (backend/, `npm run start:dev`). */
const BACKEND_URL = "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths: behind HA ingress the app lives under a changing prefix
  // (/api/hassio_ingress/<token>/), so absolute paths like /assets/... would miss.
  base: "./",
  plugins: [vue(), vueDevTools()],
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
