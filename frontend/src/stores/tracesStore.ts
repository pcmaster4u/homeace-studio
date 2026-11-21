import { defineStore } from "pinia";
import { ref } from "vue";

import { fetchRunHistory, type RunHistory } from "@/services/tracesService";

/** Runs of the open automation or script; reloaded when the entry or HA changes. */
export const useTracesStore = defineStore("traces", () => {
  const current = ref<RunHistory | null>(null);
  const isLoading = ref(false);
  const hasError = ref(false);
  /** The entry the next answer is for; answers for an older one are dropped. */
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
      const result = await fetchRunHistory(entityId);
      if (wanted === entityId) current.value = result;
    } catch (error) {
      console.error("Loading the run history failed", error);
      if (wanted === entityId) hasError.value = true;
    } finally {
      if (wanted === entityId) isLoading.value = false;
    }
  }

  /** After a change in HA, quietly (a run that was running may be done now). */
  function refresh(): Promise<void> {
    return wanted ? load(wanted) : Promise.resolve();
  }

  return { current, isLoading, hasError, load, refresh };
});
