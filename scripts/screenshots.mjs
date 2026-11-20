// Takes the README screenshots from a running demo (no extra packages).
//
//   1. Start the demo:  cd backend && npm run build && HOMEACE_DEMO=true PORT=3100 \
//        STATIC_DIR=../frontend/dist node dist/main.js   (build the frontend first: npm run build)
//   2. Run:             node scripts/screenshots.mjs [--url http://localhost:3100/] [--out docs/images]
//
// Drives Microsoft Edge or Google Chrome headless through the DevTools protocol, using the WebSocket
// built into Node 22+. Set BROWSER_PATH if the browser is not found.

import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DEBUG_PORT = 9333;
const SETTLE_MS = 700;
const BROWSER_START_ATTEMPTS = 50;
const CLICK_ATTEMPTS = 25;
const CLICK_RETRY_MS = 200;

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/microsoft-edge",
].filter(Boolean);

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1]
    ? process.argv[index + 1]
    : fallback;
}

const appUrl = argument("--url", "http://localhost:3100/");
const outDir = resolve(argument("--out", "docs/images"));
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Minimal DevTools protocol client for one page. */
async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  let nextId = 1;

  socket.addEventListener("message", (message) => {
    const data = JSON.parse(String(message.data));
    const waiter = pending.get(data.id);
    if (!waiter) return;
    pending.delete(data.id);
    if (data.error) waiter.reject(new Error(data.error.message));
    else waiter.resolve(data.result);
  });
  await new Promise((done, fail) => {
    socket.addEventListener("open", done, { once: true });
    socket.addEventListener("error", fail, { once: true });
  });

  return {
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((done, fail) =>
        pending.set(id, { resolve: done, reject: fail }),
      );
    },
    close: () => socket.close(),
  };
}

/** Runs code in the page and returns its result. */
async function evaluate(page, expression) {
  const { result, exceptionDetails } = await page.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails)
    throw new Error(exceptionDetails.exception?.description ?? expression);
  return result.value;
}

/** Clicks the first element matching `selector` whose text contains `text`. */
async function click(page, selector, text) {
  // The data loads after the page; try again for a few seconds before giving up.
  for (let attempt = 0; attempt < CLICK_ATTEMPTS; attempt++) {
    if (await tryClick(page, selector, text)) {
      await sleep(SETTLE_MS);
      return;
    }
    await sleep(CLICK_RETRY_MS);
  }
  throw new Error(`Nothing to click: ${selector} "${text ?? ""}"`);
}

function tryClick(page, selector, text) {
  return evaluate(
    page,
    `(() => {
      const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((node) => node.textContent.includes(${JSON.stringify(text ?? "")}));
      if (!el) return false;
      // No scrollIntoView: it would also shift containers with overflow: hidden.
      el.click();
      return true;
    })()`,
  );
}

async function open(page, { width, height, scale, isMobile, isDark, locale }) {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: isMobile,
  });
  await page.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: isDark ? "dark" : "light" },
    ],
  });
  await page.send("Page.navigate", { url: appUrl });
  await sleep(SETTLE_MS);
  await evaluate(
    page,
    `localStorage.clear(); localStorage.setItem("homeace.locale", "${locale}")`,
  );
  await page.send("Page.reload");
  await sleep(SETTLE_MS * 2);
  // Slide-ins must be finished on the picture, whatever the browser's frame timing.
  await evaluate(
    page,
    `document.head.insertAdjacentHTML("beforeend",
      "<style>*,*::before,*::after{transition:none!important;animation:none!important}</style>")`,
  );
}

async function capture(page, name) {
  const { data } = await page.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(outDir, name), Buffer.from(data, "base64"));
  console.log("  " + name);
}

const DESKTOP = { width: 1440, height: 900, scale: 1.5, isMobile: false };
const PHONE = { width: 390, height: 844, scale: 2, isMobile: true };

/** The README pictures: what each shows and how to get there. */
const SHOTS = [
  {
    name: "overview-light.png",
    view: { ...DESKTOP, isDark: false },
    steps: async (page) => {
      await click(page, ".category-tree-node", "House");
      await click(page, ".category-tree-node", "Terrace");
      await click(page, ".entry-list-row__open", "Terrace light on motion");
    },
  },
  {
    name: "flow-dark.png",
    view: { ...DESKTOP, isDark: true },
    steps: async (page) => {
      await click(page, ".category-tree-node", "House");
      await click(page, ".category-tree-node", "Garden");
      await click(page, ".entry-list-row__open", "Morning garden watering");
    },
  },
  {
    name: "editing-light.png",
    view: { ...DESKTOP, isDark: false },
    steps: async (page) => {
      await click(page, ".category-tree-node", "Energy");
      await click(
        page,
        ".entry-list-row__open",
        "Solar surplus into the wallbox",
      );
      await click(page, ".flow-block__chip--editable", "1500");
    },
  },
  {
    name: "cleanup-light.png",
    view: { ...DESKTOP, isDark: false },
    steps: async (page) => {
      await click(page, ".cleanup-hint .btn--primary");
      await click(page, ".cleanup__section-head .btn", "Tick all");
      await click(
        page,
        ".cleanup__row:has(input[type=radio]) > input[type=checkbox]",
      );
    },
  },
  {
    name: "checkup-light.png",
    view: { ...DESKTOP, isDark: false },
    steps: async (page) => {
      await click(page, ".category-tree__special", "Check-up");
      await click(page, ".checkup-list__open", "Hallway light at night");
    },
  },
  {
    name: "picker-dark.png",
    view: { ...DESKTOP, isDark: true },
    steps: async (page) => {
      await click(page, ".category-tree-node", "House");
      await click(page, ".category-tree-node", "Terrace");
      await click(page, ".entry-list-row__open", "Terrace light on motion");
      // The light of the "Turn on" action; the same name also appears in other blocks.
      await evaluate(
        page,
        `[...document.querySelectorAll(".flow-block__chip--entity")]
          .find((chip) => chip.closest(".flow-block")?.textContent.includes("Turn on"))
          ?.click()`,
      );
      await sleep(SETTLE_MS);
      await click(page, ".entity-picker__chip", "Living room");
    },
  },
  {
    name: "phone-dark.png",
    view: { ...PHONE, isDark: true },
    steps: async (page) => {
      await click(page, ".entry-list__nav-toggle");
      await click(page, ".category-tree-node", "House");
      await click(page, ".category-tree-node", "Terrace");
    },
  },
  {
    name: "phone-flow-light.png",
    view: { ...PHONE, isDark: false },
    steps: async (page) => {
      await click(page, ".entry-list__nav-toggle");
      await click(page, ".category-tree-node", "Routines");
      await click(page, ".entry-list-row__open", "Good night");
    },
  },
  {
    // Last, because it leaves a plan from an AI in the demo, which the other pictures should not show.
    name: "ai-plan-light.png",
    view: { ...DESKTOP, isDark: false },
    before: seedAiPlan,
    steps: async (page) => {
      await click(page, ".ai-hint .btn--primary");
    },
  },
];

/** Sends a folder plan through the MCP endpoint of the demo, as an AI client would. */
async function seedAiPlan() {
  const api = new URL("api/mcp", appUrl);
  const access = await fetch(api, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isEnabled: true }),
  });
  const { data } = await access.json();
  const mcp = new URL(
    `http://${new URL(appUrl).hostname}:${data.hostPort}${data.path}`,
  );
  const plan = {
    title: "Sort by rooms",
    reasoning:
      "You mostly look for things by room, so security and the office move under House, and the old test goes to an archive instead of staying uncategorized.",
    operations: [
      { type: "renameFolder", from: "Security", to: "House/Security" },
      {
        type: "moveEntry",
        entityId: "automation.office_heating_in_the_morning",
        to: "House/Office",
      },
      {
        type: "moveEntry",
        entityId: "automation.office_lights_on_presence",
        to: "House/Office",
      },
      {
        type: "moveEntry",
        entityId: "input_number.office_target_temperature",
        to: "House/Office",
      },
      {
        type: "moveEntry",
        entityId: "automation.old_light_switch_test",
        to: "Archive",
      },
    ],
  };
  const response = await fetch(mcp, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "propose_folder_plan", arguments: plan },
    }),
  });
  if (!response.ok) throw new Error(`MCP answered ${response.status}`);
  await response.text();
}

function findBrowser() {
  const path = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!path) throw new Error("No Edge or Chrome found; set BROWSER_PATH.");
  return path;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const profile = mkdtempSync(join(tmpdir(), "homeace-shots-"));
  const browser = spawn(findBrowser(), [
    "--headless=new",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--lang=en-US",
    "about:blank",
  ]);

  try {
    let target;
    for (
      let attempt = 0;
      attempt < BROWSER_START_ATTEMPTS && !target;
      attempt++
    ) {
      await sleep(200);
      try {
        const targets = await (
          await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)
        ).json();
        target = targets.find((item) => item.type === "page");
      } catch {
        // The browser is still starting.
      }
    }
    if (!target) throw new Error("The browser did not start.");

    const page = await connect(target.webSocketDebuggerUrl);
    await page.send("Page.enable");
    console.log(`Screenshots of ${appUrl} → ${outDir}`);

    for (const shot of SHOTS) {
      await shot.before?.();
      await open(page, { ...shot.view, locale: "en" });
      await shot.steps(page);
      await capture(page, shot.name);
    }

    page.close();
  } finally {
    browser.kill();
    await sleep(500);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
