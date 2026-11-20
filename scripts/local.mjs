// Local test environment without Docker: builds frontend and backend and runs them as one server,
// like the app inside Home Assistant.
//
//   node scripts/local.mjs           → http://localhost:8099 against your HA (.env: HA_URL, HA_TOKEN)
//   node scripts/local.mjs --demo    → http://localhost:8099 with the invented demo home
//   --skip-build                     → start the last build again
//
// Against your HA it changes things for real, like the installed app; extras go to data/overlay.json.
// Needs Node.js 22+. Installs missing packages on the first run.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PORT = "8099";
const isDemo = process.argv.includes("--demo");
const skipBuild = process.argv.includes("--skip-build");
/** npm is a .cmd file on Windows, which needs a shell. */
const isWindows = process.platform === "win32";

function run(command, args, cwd) {
  console.log(`\n> ${command} ${args.join(" ")}   (${cwd.slice(ROOT.length + 1) || "."})`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: isWindows });

  if (result.status !== 0) {
    console.error(`\nFailed: ${command} ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }
}

for (const part of ["frontend", "backend"]) {
  const dir = join(ROOT, part);

  if (!existsSync(join(dir, "node_modules"))) run("npm", ["ci"], dir);
  if (!skipBuild) run("npm", ["run", "build"], dir);
}

if (!isDemo && !existsSync(join(ROOT, ".env"))) {
  console.error("\nNo .env found. Copy .env.example to .env and set HA_URL and HA_TOKEN, or use --demo.");
  process.exit(1);
}

console.log(
  `\nHomeAce Studio ${isDemo ? "(demo home)" : "(your Home Assistant)"} → http://localhost:${PORT}` +
    "\nAI access (MCP) on port 8098 once switched on in the settings. Stop with Ctrl+C.\n",
);

const server = spawn("node", ["dist/main.js"], {
  cwd: join(ROOT, "backend"),
  stdio: "inherit",
  env: {
    ...process.env,
    PORT,
    STATIC_DIR: join(ROOT, "frontend", "dist"),
    // Wins over a value in .env, so --demo always means demo.
    HOMEACE_DEMO: isDemo ? "true" : "false",
  },
});

server.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => server.kill("SIGINT"));
