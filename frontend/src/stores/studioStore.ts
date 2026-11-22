import { defineStore } from "pinia";
import { ref, watch } from "vue";

import { CATEGORY_FILTER, SCOPE_ALL, type EntryScope } from "@/constants/entries";

/** What the user is looking at: tree selection, scope tab, search, the open entry and ticked rows. */
export const useStudioStore = defineStore("studio", () => {
  const category = ref<string>(CATEGORY_FILTER.all);
  const scope = ref<EntryScope>(SCOPE_ALL);
  const search = ref("");
  const selectedEntityId = ref<string | null>(null);
  /** Rows ticked for moving several entries at once. */
  const checkedIds = ref<ReadonlySet<string>>(new Set());
  /** An entry being renamed in place: in its list row or in the detail title. */
  const renaming = ref<{ entityId: string; place: "list" | "title" } | null>(null);

  function startRename(entityId: string, place: "list" | "title"): void {
    renaming.value = { entityId, place };
  }

  function stopRename(): void {
    renaming.value = null;
  }

  function selectCategory(path: string): void {
    category.value = path;
  }

  function selectEntry(entityId: string | null): void {
    selectedEntityId.value = entityId;
  }

  function setChecked(entityIds: readonly string[], isChecked: boolean): void {
    const next = new Set(checkedIds.value);

    for (const entityId of entityIds) {
      if (isChecked) next.add(entityId);
      else next.delete(entityId);
    }

    checkedIds.value = next;
  }

  function clearChecked(): void {
    if (checkedIds.value.size > 0) checkedIds.value = new Set();
  }

  // Ticked rows belong to what is on screen; another folder or tab starts fresh.
  watch([category, scope], clearChecked);

  return {
    category,
    scope,
    search,
    selectedEntityId,
    checkedIds,
    renaming,
    startRename,
    stopRename,
    selectCategory,
    selectEntry,
    setChecked,
    clearChecked,
  };
});
