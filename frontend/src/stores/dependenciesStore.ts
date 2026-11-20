import { defineStore } from "pinia";
import { ref } from "vue";

import { fetchDependencies, type Dependencies } from "@/services/dependenciesService";

/** Dependencies of the open entry; reloaded when the entry or HA changes. */
export const useDependenciesStore = defineStore("dependencies", () => {
  const current = ref<Dependencies | null>(null);
  const isLoading = ref(false);
  const hasError = ref(false);
  /** The entry the next result is for; answers for an older one are dropped. */
  let wanted: string | null = null;

  async function load(entityId: string | null): Promise<void> {
    wanted = entityId;

    if (!entityId) {
      current.value = null;
      return;
    }

    if (current.value?.entityId !== entityId) current.value = null;
    isLoading.value = true;
    hasError.value = false;

    try {
      const result = await fetchDependencies(entityId);
      if (wanted === entityId) current.value = result;
    } catch (error) {
      console.error("Loading the dependencies failed", error);
      if (wanted === entityId) hasError.value = true;
    } finally {
      if (wanted === entityId) isLoading.value = false;
    }
  }

  /** After a change in HA, quietly. */
  function refresh(): Promise<void> {
    return wanted ? load(wanted) : Promise.resolve();
  }

  return { current, isLoading, hasError, load, refresh };
});
