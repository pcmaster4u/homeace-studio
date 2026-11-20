import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { fetchEntities } from "@/services/editorService";
import { fetchAreas, fetchLabels } from "@/services/lookupsService";
import type { EntityOption } from "@/types/editor";
import type { Area, Label } from "@/types/entry";

/** Areas, labels and all entities from HA, for the pickers in the detail view and the editor. */
export const useLookupsStore = defineStore("lookups", () => {
  const areas = ref<Area[]>([]);
  const labels = ref<Label[]>([]);
  const entities = ref<EntityOption[]>([]);

  /** Entity ID → friendly name, so newly picked entities show their name right away. */
  const entityNames = computed(() =>
    Object.fromEntries(entities.value.map((entity) => [entity.entityId, entity.name])),
  );

  async function load(): Promise<void> {
    try {
      [areas.value, labels.value] = await Promise.all([fetchAreas(), fetchLabels()]);
    } catch (error) {
      // The detail still shows the names that come with each entry.
      console.error("Loading areas and labels failed", error);
    }
  }

  /** Loads the entity list once, when the first entity picker opens. */
  async function loadEntities(): Promise<void> {
    if (entities.value.length > 0) return;

    try {
      entities.value = await fetchEntities();
    } catch (error) {
      console.error("Loading the entities failed", error);
    }
  }

  return { areas, labels, entities, entityNames, load, loadEntities };
});
