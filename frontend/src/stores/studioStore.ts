import { defineStore } from "pinia";
import { ref } from "vue";

import { CATEGORY_FILTER, SCOPE_ALL, type EntryScope } from "@/constants/entries";

/** What the user is looking at: tree selection, scope tab, search and the open entry. */
export const useStudioStore = defineStore("studio", () => {
  const category = ref<string>(CATEGORY_FILTER.all);
  const scope = ref<EntryScope>(SCOPE_ALL);
  const search = ref("");
  const selectedEntityId = ref<string | null>(null);

  function selectCategory(path: string): void {
    category.value = path;
  }

  function selectEntry(entityId: string | null): void {
    selectedEntityId.value = entityId;
  }

  return { category, scope, search, selectedEntityId, selectCategory, selectEntry };
});
