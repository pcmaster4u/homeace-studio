import type { Overlay } from "../overlay/overlay.model";
import type { Entry } from "./entry.model";

/**
 * Adds the user's own extras (favorite, note) from the overlay to entries from HA.
 *
 * @returns New entry objects; entries without extras get `isFavorite: false` and `note: null`.
 */
export function withExtras(entries: readonly Entry[], overlay: Overlay): Entry[] {
  const favorites = new Set(overlay.favorites);

  return entries.map((entry) => ({
    ...entry,
    isFavorite: favorites.has(entry.entityId),
    note: overlay.notes[entry.entityId] ?? null,
  }));
}

/**
 * Applies a change of favorite and note for one entity to the overlay.
 *
 * @param extras - `isFavorite` sets or clears the favorite; `note` null or blank removes the note.
 *   Missing fields stay as they are.
 */
export function applyExtras(
  overlay: Overlay,
  entityId: string,
  extras: { isFavorite?: boolean; note?: string | null },
): Overlay {
  const favorites = overlay.favorites.filter((id) => id !== entityId);
  const notes = { ...overlay.notes };

  if (extras.isFavorite ?? overlay.favorites.includes(entityId)) {
    favorites.push(entityId);
  }

  if (extras.note !== undefined) {
    const note = extras.note?.trim();

    if (note) {
      notes[entityId] = note;
    } else {
      delete notes[entityId];
    }
  }

  return { ...overlay, favorites, notes };
}

/** Removes all extras of an entity, e.g. after it was deleted in HA. */
export function removeExtras(overlay: Overlay, entityId: string): Overlay {
  return applyExtras(overlay, entityId, { isFavorite: false, note: null });
}
