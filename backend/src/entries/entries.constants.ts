import { CATEGORY_SCOPE, type CategoryScope } from "../categories/categories.constants";
import { ENTRY_KIND, type EntryAction, type EntryKind } from "./entry.model";

export const ENTRY_REPOSITORY = Symbol("ENTRY_REPOSITORY");

export const CATEGORY_SCOPE_BY_KIND: Record<EntryKind, CategoryScope> = {
  automation: CATEGORY_SCOPE.automation,
  script: CATEGORY_SCOPE.script,
  scene: CATEGORY_SCOPE.scene,
  helper: CATEGORY_SCOPE.helpers,
};

export const KIND_BY_DOMAIN: Partial<Record<string, EntryKind>> = {
  automation: ENTRY_KIND.automation,
  script: ENTRY_KIND.script,
  scene: ENTRY_KIND.scene,
};

/**
 * Which HA service an action calls, per domain. Domains not listed do not support the action.
 * "run" triggers an automation even if its conditions are not met, like HA's "Run actions".
 */
export const SERVICE_BY_ACTION: Record<EntryAction, Partial<Record<string, string>>> = {
  run: { automation: "trigger", script: "turn_on", scene: "turn_on", input_button: "press" },
  turnOn: { automation: "turn_on", input_boolean: "turn_on" },
  turnOff: { automation: "turn_off", input_boolean: "turn_off", script: "turn_off" },
};

/** Helper domains HA manages itself. Config-entry helpers (template, group, …) are detected separately. */
export const HELPER_DOMAINS: ReadonlySet<string> = new Set([
  "input_boolean",
  "input_button",
  "input_datetime",
  "input_number",
  "input_select",
  "input_text",
  "counter",
  "timer",
  "schedule",
]);
