import { defineStore } from "pinia";
import { ref } from "vue";

import { fetchEntryAreas, type EntryAreaLink } from "@/services/entryAreasService";

const NONE: readonly EntryAreaLink[] = [];

/** Own and derived areas of every entry, for the area view; reloaded after changes in HA. */
export const useEntryAreasStore = defineStore("entryAreas", () => {
  const byEntity = ref<ReadonlyMap<string, readonly EntryAreaLink[]>>(new Map());
  const hasLoaded = ref(false);

  async function load(): Promise<void> {
    try {
      const all = await fetchEntryAreas();
      byEntity.value = new Map(all.map((item) => [item.entityId, item.areas]));
      hasLoaded.value = true;
    } catch (error) {
      // The area view then shows everything under "Ohne Bereich" until the next try.
      console.error("Loading the entry areas failed", error);
    }
  }

  function linksOf(entityId: string): readonly EntryAreaLink[] {
    return byEntity.value.get(entityId) ?? NONE;
  }

  return { byEntity, hasLoaded, load, linksOf };
});
