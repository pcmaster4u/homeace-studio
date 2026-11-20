// POC step 6a: which machine-readable descriptions does HA offer for the visual editor?
// Read-only. Tries the WebSocket commands that describe triggers, conditions and actions,
// and prints the shape of one real trigger, condition and service-call action.
//
// Usage (from the project root, Node 22+):
//   node --env-file=.env poc/editor-schema-probe.mjs

const { HA_URL, HA_TOKEN } = process.env;
if (!HA_URL || !HA_TOKEN) {
  console.error("HA_URL and HA_TOKEN missing. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const ws = new WebSocket(HA_URL.replace(/\/+$/, "").replace(/^http/, "ws") + "/api/websocket");
const pending = new Map();
const firstEvents = new Map();
let nextId = 1;

const ready = new Promise((resolve, reject) => {
  ws.onerror = () => reject(new Error("Cannot connect"));
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "auth_required") ws.send(JSON.stringify({ type: "auth", access_token: HA_TOKEN }));
    else if (msg.type === "auth_ok") resolve(msg.ha_version);
    else if (msg.type === "auth_invalid") reject(new Error("Token rejected"));
    else if (msg.type === "event" && !firstEvents.has(msg.id)) firstEvents.set(msg.id, msg.event);
    else if (msg.type === "result" && pending.has(msg.id)) {
      const { res } = pending.get(msg.id);
      pending.delete(msg.id);
      res(msg);
    }
  };
});

/** Resolves with the raw result message, so failures show their error code instead of throwing. */
function call(type, data = {}) {
  return new Promise((res) => {
    const id = nextId++;
    pending.set(id, { res, id });
    ws.send(JSON.stringify({ id, type, ...data }));
  }).then((msg) => ({ ...msg, requestId: msg.id }));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const preview = (value, length = 900) => JSON.stringify(value, null, 2).slice(0, length);

try {
  console.log(`Connected to Home Assistant ${await ready}`);

  // 1. Description commands (subscriptions answer with a result, then an event with the data).
  for (const type of ["trigger_platforms/subscribe", "condition_platforms/subscribe"]) {
    const result = await call(type);
    await wait(1500);
    const event = firstEvents.get(result.requestId);
    const keys = event ? Object.keys(event) : [];
    console.log(`\n${type}: ${result.success ? "OK" : `FAILED (${result.error?.code})`}, ${keys.length} entries`);
    console.log(`  some keys: ${keys.slice(0, 25).join(", ")}`);
    for (const key of ["button.pressed", "zone.entered", "switch.is_on", "power.is_value", "state"]) {
      if (event?.[key]) console.log(`\n  ${key}:\n${preview(event[key], 700)}`);
    }
  }

  const services = await call("get_services");
  const sceneTurnOn = services.result?.scene?.turn_on;
  const setTemperature = services.result?.climate?.set_temperature;
  console.log(`\nget_services: ${services.success ? "OK" : "FAILED"}, ${Object.keys(services.result ?? {}).length} domains`);
  console.log(`  scene.turn_on:\n${preview(sceneTurnOn, 500)}`);
  console.log(`  climate.set_temperature:\n${preview(setTemperature, 900)}`);

  // 2. Shape of real blocks from the first automation that has each.
  const states = (await call("get_states")).result;
  const automationIds = states.filter((s) => s.entity_id.startsWith("automation.")).map((s) => s.entity_id);
  const shown = new Set();
  for (const entityId of automationIds) {
    const { result } = await call("automation/config", { entity_id: entityId });
    const config = result?.config ?? {};
    for (const trigger of config.triggers ?? []) {
      const kind = `trigger ${trigger.trigger}`;
      if (shown.has(kind)) continue;
      shown.add(kind);
      console.log(`\nExample ${kind}:\n${preview(trigger, 500)}`);
    }
    for (const condition of config.conditions ?? []) {
      const kind = `condition ${condition.condition}`;
      if (shown.has(kind)) continue;
      shown.add(kind);
      console.log(`\nExample ${kind}:\n${preview(condition, 500)}`);
    }
    const action = (config.actions ?? []).find((item) => item.action?.startsWith("climate."));
    if (action && !shown.has("climate action")) {
      shown.add("climate action");
      console.log(`\nExample action:\n${preview(action, 500)}`);
    }
  }

  // 3. Why are scenes not readable via the config API?
  const scene = states.find((s) => s.entity_id.startsWith("scene."));
  const registry = (await call("config/entity_registry/list")).result ?? [];
  const sceneEntry = registry.find((entry) => entry.entity_id === scene?.entity_id);
  console.log(`\nFirst scene: attributes keys = ${Object.keys(scene?.attributes ?? {}).join(", ")}`);
  console.log(`  registry platform = ${sceneEntry?.platform}`);
  const scenePlatforms = new Map();
  for (const entry of registry.filter((item) => item.entity_id.startsWith("scene."))) {
    scenePlatforms.set(entry.platform, (scenePlatforms.get(entry.platform) ?? 0) + 1);
  }
  console.log(`  scene platforms: ${JSON.stringify(Object.fromEntries(scenePlatforms))}`);
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
} finally {
  ws.close();
}
