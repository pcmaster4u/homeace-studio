// Assembles the local add-on folder the HA Supervisor builds from.
//
// The Supervisor's build context is the add-on folder itself, so it must contain the sources:
//   <out>/config.yaml, Dockerfile, DOCS.md, .dockerignore   (from homeace-studio/)
//   <out>/frontend/, <out>/backend/                         (sources, without node_modules/dist/.env)
//
// Usage (from the project root, Node 22+):
//   node scripts/build-addon.mjs                         → dist-addon/homeace_studio
//   node scripts/build-addon.mjs --to \\homeassistant.local\addons
//                                                        → <share>/homeace_studio (e.g. Samba share)

import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const ADDON_SLUG = "homeace_studio";
const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const ADDON_SOURCE = join(PROJECT_ROOT, "homeace-studio");
const SOURCE_PARTS = ["frontend", "backend"];
/** Never copied: installed packages, build output, local secrets and caches. */
const SKIPPED_NAMES = new Set(["node_modules", "dist", "coverage", ".env", ".eslintcache", ".vscode"]);

const targetFlagIndex = process.argv.indexOf("--to");
const targetParent =
  targetFlagIndex === -1 ? join(PROJECT_ROOT, "dist-addon") : process.argv[targetFlagIndex + 1];

if (!targetParent) {
  console.error("Missing folder after --to, e.g. --to \\\\homeassistant.local\\addons");
  process.exit(1);
}

const target = join(targetParent, ADDON_SLUG);
const keep = (path) => !SKIPPED_NAMES.has(basename(path));

// Start clean, so files deleted in the repo do not linger in the add-on folder.
if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true });
}

cpSync(ADDON_SOURCE, target, { recursive: true });

for (const part of SOURCE_PARTS) {
  cpSync(join(PROJECT_ROOT, part), join(target, part), { recursive: true, filter: keep });
}

// Released versions name a ready-made image; a local app must build from these sources instead.
const configPath = join(target, "config.yaml");
const config = readFileSync(configPath, "utf8");
writeFileSync(configPath, config.replace(/^image:.*\r?\n/m, ""));

console.log(`Add-on folder ready: ${target}`);
console.log("In HA: Settings → Apps → App store → ⋮ → Check for updates → Local apps.");
