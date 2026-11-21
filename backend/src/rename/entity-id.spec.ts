import { countEntityId, replaceEntityId } from "./entity-id";

const CONFIG = {
  triggers: [{ trigger: "state", entity_id: "light.terrace", to: "on" }],
  conditions: [{ condition: "state", entity_id: ["light.terrace", "light.terrace_paths"] }],
  actions: [
    { action: "light.turn_on", target: { entity_id: "light.terrace" } },
    { action: "script.light_terrace" },
    { wait_template: "{{ is_state('light.terrace', 'off') and states.xlight.terrace }}" },
  ],
};

describe("countEntityId", () => {
  it("counts the whole ID in fields, lists and templates", () => {
    expect(countEntityId(CONFIG, "light.terrace")).toBe(4);
  });

  it("leaves service names out: action: script.x calls the script by its key", () => {
    expect(countEntityId(CONFIG, "script.light_terrace")).toBe(0);
  });
});

describe("replaceEntityId", () => {
  it("replaces every occurrence and nothing that only looks alike", () => {
    const next = replaceEntityId(CONFIG, "light.terrace", "light.patio") as typeof CONFIG;

    expect(next.triggers[0]?.entity_id).toBe("light.patio");
    expect(next.conditions[0]?.entity_id).toEqual(["light.patio", "light.terrace_paths"]);
    expect(next.actions[0]).toEqual({
      action: "light.turn_on",
      target: { entity_id: "light.patio" },
    });
    expect(next.actions[2]?.wait_template).toBe(
      "{{ is_state('light.patio', 'off') and states.xlight.terrace }}",
    );
    expect(countEntityId(next, "light.terrace")).toBe(0);
  });

  it("keeps service calls as they are", () => {
    const next = replaceEntityId(CONFIG, "script.light_terrace", "script.patio") as typeof CONFIG;

    expect(next.actions[1]).toEqual({ action: "script.light_terrace" });
  });
});
