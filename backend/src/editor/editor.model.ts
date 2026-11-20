/** One input of a trigger, condition or action, e.g. "for" of zone.entered. */
export type CatalogField = {
  /** Translated name, e.g. "Für mindestens"; null when HA has none. */
  name: string | null;
  description: string | null;
  required: boolean;
  default?: unknown;
  /** HA selector as it comes, e.g. `{ duration: { enable_second: true } }`; null when missing. */
  selector: Record<string, unknown> | null;
};

/** A trigger, condition or action type the editor can show. */
export type CatalogEntry = {
  /** Translated name, e.g. "Zone betreten"; the key itself when HA has no translation. */
  name: string;
  description: string | null;
  fields: Record<string, CatalogField>;
  /** Which entities the block targets, as HA describes it; null when it has no target. */
  target: unknown;
};

/** Everything the editor needs to turn blocks into readable sentences, for one language. */
export type EditorCatalog = {
  /** Keyed like the `trigger` value, e.g. "zone.entered". */
  triggers: Record<string, CatalogEntry>;
  /** Keyed like the `condition` value, e.g. "switch.is_on". */
  conditions: Record<string, CatalogEntry>;
  /** Keyed like the `action` value, e.g. "climate.set_temperature". */
  actions: Record<string, CatalogEntry>;
};

export const FLOW_KIND = {
  automation: "automation",
  script: "script",
} as const;

export type FlowKind = (typeof FLOW_KIND)[keyof typeof FLOW_KIND];

/** The configuration of an automation or script, as HA stores it, plus names for display. */
export type Flow = {
  entityId: string;
  kind: FlowKind;
  /** Untouched HA config; the editor keeps every field it does not know. */
  config: Record<string, unknown>;
  /** Friendly names of every entity the config mentions, e.g. { "person.x": "Mara" }. */
  entityNames: Record<string, string>;
  /**
   * HomeAce Studio can save it: it lives in automations.yaml / scripts.yaml and is not built from
   * a blueprint. Flows from packages or other YAML files are shown read-only.
   */
  isEditable: boolean;
};
