import { HELPER_DOMAINS, KIND_BY_DOMAIN } from "../entries/entries.constants";
import type { HaEvent } from "../ha/ha.types";

export const STATE_CHANGED_EVENT = "state_changed";

/** Registry changes always matter: names, icons, areas, labels and categories come from there. */
export const REGISTRY_EVENTS: readonly string[] = [
  "entity_registry_updated",
  "category_registry_updated",
  "label_registry_updated",
  "area_registry_updated",
];

/** Every event type the live updates listen to. */
export const LIVE_EVENT_TYPES: readonly string[] = [STATE_CHANGED_EVENT, ...REGISTRY_EVENTS];

const DOMAIN_SEPARATOR = ".";

type StateObject = { state?: unknown } | null | undefined;

/**
 * Whether an HA event changes something the UI shows.
 *
 * State changes count only for automations, scripts, scenes and HA-managed helpers, and only when
 * the state itself changes (not just attributes like `last_triggered`). Sensors and config-entry
 * helpers such as template sensors change all the time and would cause constant reloads.
 */
export function isRelevantChange(event: HaEvent): boolean {
  if (REGISTRY_EVENTS.includes(event.event_type)) return true;
  if (event.event_type !== STATE_CHANGED_EVENT) return false;

  const entityId = typeof event.data.entity_id === "string" ? event.data.entity_id : "";
  const domain = entityId.split(DOMAIN_SEPARATOR)[0] ?? "";
  const isShownDomain = KIND_BY_DOMAIN[domain] !== undefined || HELPER_DOMAINS.has(domain);

  if (!isShownDomain) return false;

  const oldState = (event.data.old_state as StateObject)?.state;
  const newState = (event.data.new_state as StateObject)?.state;

  // Created or removed entities (one side missing) and real state changes both count.
  return oldState !== newState;
}
