// POC step 6a: what do the automations, scripts and scenes in this HA actually use?
// Read-only. Prints counts only (types and numbers, no names), to plan the visual editor.
//
// Usage (from the project root, Node 22+):
//   node --env-file=.env poc/automation-inventory.mjs

const { HA_URL, HA_TOKEN } = process.env;
if (!HA_URL || !HA_TOKEN) {
  console.error("HA_URL and HA_TOKEN missing. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const baseUrl = HA_URL.replace(/\/+$/, "");

// ---- minimal HA WebSocket client (same as categories-test.mjs) ------------------------------
function connect() {
  const ws = new WebSocket(baseUrl.replace(/^http/, "ws") + "/api/websocket");
  const pending = new Map();
  let nextId = 1;
  const ready = new Promise((resolve, reject) => {
    ws.onerror = () => reject(new Error("Cannot connect"));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "auth_required") ws.send(JSON.stringify({ type: "auth", access_token: HA_TOKEN }));
      else if (msg.type === "auth_ok") resolve(msg.ha_version);
      else if (msg.type === "auth_invalid") reject(new Error("Token rejected"));
      else if (msg.type === "result" && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.success ? res(msg.result) : rej(new Error(`${msg.error?.code}: ${msg.error?.message}`));
      }
    };
  });
  const call = (type, data = {}) =>
    new Promise((res, rej) => {
      const id = nextId++;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, type, ...data }));
    });
  return { ready, call, close: () => ws.close() };
}

// ---- counting helpers ---------------------------------------------------------------------
class Counter {
  constructor() {
    this.counts = new Map();
  }
  add(key) {
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }
  print(title) {
    const rows = [...this.counts.entries()].sort((a, b) => b[1] - a[1]);
    const total = rows.reduce((sum, [, count]) => sum + count, 0);
    console.log(`\n${title} (${total}):`);
    for (const [key, count] of rows) console.log(`  ${String(count).padStart(4)}  ${key}`);
  }
}

const asList = (value) => (value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]);
const hasTemplate = (value) => JSON.stringify(value ?? "").includes("{{");

const stats = {
  triggers: new Counter(),
  conditions: new Counter(),
  actions: new Counter(),
  services: new Counter(),
  modes: new Counter(),
  syntax: new Counter(),
  editable: new Counter(),
  depth: new Counter(),
  disabledBlocks: 0,
  templates: 0,
};

function countTrigger(trigger) {
  if (trigger?.enabled === false) stats.disabledBlocks++;
  stats.triggers.add(trigger?.trigger ?? trigger?.platform ?? "(unknown)");
}

function countCondition(condition) {
  if (typeof condition === "string") return stats.conditions.add("template (shorthand)");
  if (condition?.enabled === false) stats.disabledBlocks++;
  stats.conditions.add(condition?.condition ?? "(unknown)");
  for (const nested of asList(condition?.conditions)) countCondition(nested);
}

/** Which kind of action a step is; HA decides by the keys it contains. */
function actionKind(action) {
  const keys = ["choose", "if", "repeat", "parallel", "sequence", "delay", "wait_template",
    "wait_for_trigger", "variables", "stop", "event", "scene", "condition", "device_id",
    "set_conversation_response"];
  if (action?.action || action?.service) return "action (service call)";
  return keys.find((key) => action && key in action) ?? "(unknown)";
}

function countActions(actions, depth) {
  for (const action of asList(actions)) {
    const kind = actionKind(action);
    stats.actions.add(kind);
    stats.depth.add(`depth ${depth}`);
    if (action?.enabled === false) stats.disabledBlocks++;
    if (kind === "action (service call)") stats.services.add(action.action ?? action.service);
    if (kind === "condition") countCondition(action);
    countNested(action, depth + 1);
  }
}

function countNested(action, depth) {
  for (const option of asList(action?.choose)) {
    for (const condition of asList(option?.conditions)) countCondition(condition);
    countActions(option?.sequence, depth);
  }
  if (action?.choose) countActions(action.default, depth);
  if (action?.if) {
    for (const condition of asList(action.if)) countCondition(condition);
    countActions(action.then, depth);
    countActions(action.else, depth);
  }
  countActions(action?.repeat?.sequence, depth);
  for (const branch of asList(action?.parallel)) countActions(branch?.sequence ?? branch, depth);
  if (Array.isArray(action?.sequence) && !action.choose) countActions(action.sequence, depth);
}

// ---- main ---------------------------------------------------------------------------------
const ha = connect();
try {
  const version = await ha.ready;
  console.log(`Connected to Home Assistant ${version}`);

  const states = await ha.call("get_states");
  const automations = states.filter((state) => state.entity_id.startsWith("automation."));
  const scripts = states.filter((state) => state.entity_id.startsWith("script."));
  const scenes = states.filter((state) => state.entity_id.startsWith("scene."));

  for (const automation of automations) {
    const { config } = await ha.call("automation/config", { entity_id: automation.entity_id });
    const isNewSyntax = "triggers" in config || "actions" in config;
    stats.syntax.add(isNewSyntax ? "new (triggers/conditions/actions)" : "old (trigger/condition/action)");
    stats.editable.add(config.id ? "automation with id (editable in the UI)" : "automation without id (YAML only)");
    stats.modes.add(config.mode ?? "single");
    if (hasTemplate(config)) stats.templates++;
    for (const trigger of asList(config.triggers ?? config.trigger)) countTrigger(trigger);
    for (const condition of asList(config.conditions ?? config.condition)) countCondition(condition);
    countActions(config.actions ?? config.action, 1);
  }

  for (const script of scripts) {
    const { config } = await ha.call("script/config", { entity_id: script.entity_id });
    stats.modes.add(`script: ${config.mode ?? "single"}`);
    if (hasTemplate(config)) stats.templates++;
    if (config.fields && Object.keys(config.fields).length) stats.editable.add("script with fields");
    countActions(config.sequence, 1);
  }

  let sceneEntities = 0;
  let editableScenes = 0;
  for (const scene of scenes) {
    const id = scene.attributes?.id;
    if (!id) continue;
    const response = await fetch(`${baseUrl}/api/config/scene/config/${id}`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}` },
    });
    if (!response.ok) continue;
    const config = await response.json();
    editableScenes++;
    sceneEntities += Object.keys(config.entities ?? {}).length;
  }

  console.log(`\nAutomations: ${automations.length}, scripts: ${scripts.length}, scenes: ${scenes.length}`);
  console.log(`Scenes editable via the config API: ${editableScenes}, entities in them: ${sceneEntities}`);
  console.log(`Automations/scripts using templates: ${stats.templates}, disabled blocks: ${stats.disabledBlocks}`);
  stats.editable.print("Editability");
  stats.syntax.print("Automation syntax");
  stats.modes.print("Modes");
  stats.triggers.print("Trigger types");
  stats.conditions.print("Condition types");
  stats.actions.print("Action types");
  stats.services.print("Called services");
  stats.depth.print("Action nesting");
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
} finally {
  ha.close();
}
