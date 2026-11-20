import type { HaEvent } from "../ha/ha.types";
import { isRelevantChange } from "./live-events";

function stateChanged(entityId: string, oldState: string | null, newState: string | null): HaEvent {
  return {
    event_type: "state_changed",
    data: {
      entity_id: entityId,
      old_state: oldState === null ? null : { state: oldState },
      new_state: newState === null ? null : { state: newState },
    },
  };
}

describe("isRelevantChange", () => {
  it("counts real state changes of shown domains", () => {
    expect(isRelevantChange(stateChanged("automation.licht", "on", "off"))).toBe(true);
    expect(isRelevantChange(stateChanged("input_boolean.gaeste", "off", "on"))).toBe(true);
  });

  it("ignores attribute-only changes and domains the list does not show", () => {
    expect(isRelevantChange(stateChanged("automation.licht", "on", "on"))).toBe(false);
    expect(isRelevantChange(stateChanged("sensor.temperatur", "20.1", "20.2"))).toBe(false);
    expect(isRelevantChange(stateChanged("light.terrasse", "off", "on"))).toBe(false);
  });

  it("counts created and removed entities", () => {
    expect(isRelevantChange(stateChanged("script.neu", null, "off"))).toBe(true);
    expect(isRelevantChange(stateChanged("script.alt", "off", null))).toBe(true);
  });

  it("always counts registry changes and ignores other event types", () => {
    expect(isRelevantChange({ event_type: "category_registry_updated", data: {} })).toBe(true);
    expect(isRelevantChange({ event_type: "call_service", data: {} })).toBe(false);
  });
});
