import type { Entry } from "../entries/entry.model";
import type { HaState } from "../ha/ha.types";
import { analyzeCheckup, collectEntityRefs } from "./checkup-analysis";

function entry(entityId: string, overrides: Partial<Entry> = {}): Entry {
  const domain = entityId.split(".")[0];

  return {
    entityId,
    kind: domain === "automation" || domain === "script" ? domain : "helper",
    domain,
    name: entityId,
    icon: null,
    categoryId: null,
    categoryPath: null,
    labels: [],
    area: null,
    state: "on",
    isDisabled: false,
    isHidden: false,
    isInRegistry: true,
    isFavorite: false,
    note: null,
    ...overrides,
  };
}

function state(entityId: string, value = "on", extra: Partial<HaState> = {}): HaState {
  return { entity_id: entityId, state: value, attributes: { friendly_name: entityId }, ...extra };
}

const NOW = new Date("2026-11-20T12:00:00Z");

describe("check-up", () => {
  it("collects entity IDs from triggers, targets, lists and direct script calls", () => {
    const refs = collectEntityRefs({
      triggers: [{ trigger: "state", entity_id: ["binary_sensor.a", "binary_sensor.b"] }],
      actions: [
        { action: "light.turn_on", target: { entity_id: "light.c, light.d" } },
        { action: "script.good_night" },
        { action: "script.turn_on", target: { entity_id: "script.other" } },
        { condition: "template", value_template: "{{ is_state('sensor.e', 'on') }}" },
        { entity_id: "{{ trigger.entity_id }}" },
      ],
    });

    expect([...refs].sort()).toEqual([
      "binary_sensor.a",
      "binary_sensor.b",
      "light.c",
      "light.d",
      "script.good_night",
      "script.other",
    ]);
  });

  it("reports gone and unavailable references, unused helpers and idle automations", () => {
    const findings = analyzeCheckup({
      entries: [
        entry("automation.flur"),
        entry("automation.alt", { state: "off" }),
        entry("input_boolean.urlaub"),
        entry("input_boolean.gast"),
        entry("sensor.template_only", { kind: "helper", domain: "sensor" }),
      ],
      states: [
        state("automation.flur", "on", {
          attributes: { friendly_name: "Flur", last_triggered: "2026-11-19T10:00:00Z" },
        }),
        state("automation.alt", "off", {
          attributes: { friendly_name: "Alt", last_triggered: "2026-05-01T10:00:00Z" },
        }),
        state("sensor.akku", "unavailable", { last_changed: "2026-11-17T08:00:00Z" }),
        state("input_boolean.urlaub", "off"),
        state("input_boolean.gast", "off"),
      ],
      registryIds: new Set(["light.disabled"]),
      scriptKeys: new Set(["alter_name"]),
      configs: new Map([
        [
          "automation.flur",
          {
            triggers: [{ entity_id: "sensor.akku" }],
            conditions: [{ value_template: "{{ is_state('input_boolean.gast', 'off') }}" }],
            actions: [
              { target: { entity_id: ["light.weg", "light.disabled"] } },
              // A renamed script, called by its key: still works.
              { action: "script.alter_name" },
            ],
          },
        ],
        ["automation.alt", { actions: [] }],
      ]),
      now: NOW,
      ignored: new Set(),
    });

    expect(findings.map((finding) => finding.key)).toEqual([
      "gone:automation.flur",
      "unavailable:automation.flur",
      "unused:input_boolean.urlaub",
      "stale:automation.alt",
    ]);
    expect(findings[0].refs.map((ref) => ref.entityId)).toEqual(["light.weg"]);
    expect(findings[1].refs[0]).toMatchObject({
      entityId: "sensor.akku",
      since: "2026-11-17T08:00:00Z",
    });
    expect(findings[3]).toMatchObject({ isOn: false, lastTriggered: "2026-05-01T10:00:00Z" });
  });

  it("counts helpers used in scenes or groups as used", () => {
    const findings = analyzeCheckup({
      entries: [entry("input_boolean.in_scene"), entry("input_boolean.in_group")],
      states: [
        state("scene.abend", "2026-11-20T10:00:00Z", {
          attributes: { entity_id: ["input_boolean.in_scene"] },
        }),
        state("group.alle", "on", { attributes: { entity_id: ["input_boolean.in_group"] } }),
      ],
      registryIds: new Set(),
      scriptKeys: new Set(),
      configs: new Map(),
      now: NOW,
      ignored: new Set(),
    });

    expect(findings).toEqual([]);
  });

  it("leaves out ignored findings and disabled entries", () => {
    const findings = analyzeCheckup({
      entries: [entry("input_boolean.a"), entry("input_boolean.b", { isDisabled: true })],
      states: [state("input_boolean.a"), state("input_boolean.b")],
      registryIds: new Set(),
      scriptKeys: new Set(),
      configs: new Map(),
      now: NOW,
      ignored: new Set(["unused:input_boolean.a"]),
    });

    expect(findings).toEqual([]);
  });
});
