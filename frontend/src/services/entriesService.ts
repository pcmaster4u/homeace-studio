import type { EntryAction } from "@/constants/entries";
import type { Entry, EntryChanges } from "@/types/entry";

import { apiFetch, apiPost, apiSend } from "./api";

/** URL path segment per action (POST /api/entries/:id/<segment>). */
const ACTION_PATH: Record<EntryAction, string> = {
  run: "run",
  turnOn: "turn-on",
  turnOff: "turn-off",
};

const entryPath = (entityId: string): string => `/entries/${encodeURIComponent(entityId)}`;

/** All automations, scripts, scenes and helpers, sorted by name. */
export function fetchEntries(): Promise<Entry[]> {
  return apiFetch<Entry[]>("/entries");
}

/**
 * Moves an entry into a folder. HA categories are created and cleaned up by the backend.
 *
 * @param categoryPath - Target folder like "Haus/Pool"; null takes the entry out of every category.
 */
export async function moveEntry(entityId: string, categoryPath: string | null): Promise<void> {
  await apiPost<null>(`${entryPath(entityId)}/move`, { categoryPath });
}

/** Changes name, icon, area or labels in HA. @returns The entry as HA now has it. */
export function updateEntry(entityId: string, changes: EntryChanges): Promise<Entry> {
  return apiSend<Entry>("PATCH", entryPath(entityId), changes);
}

/** Runs, switches on or switches off an entry in HA. */
export async function runEntryAction(entityId: string, action: EntryAction): Promise<void> {
  await apiPost<null>(`${entryPath(entityId)}/${ACTION_PATH[action]}`);
}

/** Saves favorite and note (only in HomeAce Studio). */
export async function updateEntryExtras(
  entityId: string,
  extras: { isFavorite?: boolean; note?: string | null },
): Promise<void> {
  await apiSend<null>("PATCH", `${entryPath(entityId)}/extras`, extras);
}
