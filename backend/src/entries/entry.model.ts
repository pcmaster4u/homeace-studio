export const ENTRY_KIND = {
  automation: "automation",
  script: "script",
  scene: "scene",
  helper: "helper",
} as const;

export type EntryKind = (typeof ENTRY_KIND)[keyof typeof ENTRY_KIND];

export type EntryArea = {
  areaId: string;
  name: string;
};

export type EntryLabel = {
  labelId: string;
  name: string;
  /** HA theme color name like "indigo" or a hex value; null when unset. */
  color: string | null;
};

/** One automation, script, scene or helper, as the UI lists it. */
export type Entry = {
  entityId: string;
  kind: EntryKind;
  /** Part of the entity ID before the dot, e.g. "input_number" or "sensor" (template helper). */
  domain: string;
  name: string;
  /** HA icon name like "mdi:lightbulb"; null means "use the default icon of the kind". */
  icon: string | null;
  categoryId: string | null;
  /** Full category name as stored in HA, e.g. "Haus/Terrasse"; null when not categorized. */
  categoryPath: string | null;
  labels: EntryLabel[];
  area: EntryArea | null;
  /** Current state; null when HA has no state, e.g. for a disabled entity. */
  state: string | null;
  isDisabled: boolean;
  isHidden: boolean;
  /**
   * False for entities that exist only as state (YAML without unique_id).
   * They cannot get a category, labels or an area.
   */
  isInRegistry: boolean;
  /** Own extras from the overlay; HA does not know about them. */
  isFavorite: boolean;
  note: string | null;
};

/** What the user can change about an entry in HA (entity registry). Missing fields stay as they are. */
export type EntryChanges = {
  /** null goes back to the name the integration provides. */
  name?: string | null;
  /** "mdi:…"; null goes back to the default icon. */
  icon?: string | null;
  areaId?: string | null;
  labelIds?: string[];
  /** Other names for the voice assistant (Assist). */
  aliases?: string[];
  /** Hidden in dashboards HA builds itself (`hidden_by: user`). */
  isHidden?: boolean;
  /** Disabled: HA does not load the entity at all (`disabled_by: user`). */
  isDisabled?: boolean;
};

/** Registry fields the list does not carry; read for the open entry only. */
export type EntryDetails = {
  aliases: string[];
};

export const ENTRY_ACTION = {
  run: "run",
  turnOn: "turnOn",
  turnOff: "turnOff",
} as const;

export type EntryAction = (typeof ENTRY_ACTION)[keyof typeof ENTRY_ACTION];
