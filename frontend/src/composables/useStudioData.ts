import { computed, type ComputedRef } from "vue";

import { CATEGORY_FILTER, SCOPE_ALL, type EntryScope } from "@/constants/entries";
import { useEntriesStore } from "@/stores/entriesStore";
import { useFoldersStore } from "@/stores/foldersStore";
import { useStudioStore } from "@/stores/studioStore";
import type { Entry } from "@/types/entry";
import { buildCategoryTree, flattenCategoryPaths, type CategoryNode } from "@/utils/categoryTree";
import { countByScope, filterEntries, isSpecialCategory } from "@/utils/entryFilter";

type StudioData = {
  /** Entries of the current scope tab, regardless of tree selection and search. */
  scopedEntries: ComputedRef<Entry[]>;
  tree: ComputedRef<CategoryNode[]>;
  /** Every folder path in every scope, plus saved empty folders. */
  allCategoryPaths: ComputedRef<string[]>;
  /** The selected real folder; null for special nodes like "all". */
  currentFolder: ComputedRef<string | null>;
  uncategorizedCount: ComputedRef<number>;
  favoriteCount: ComputedRef<number>;
  scopeCounts: ComputedRef<Record<EntryScope, number>>;
  visibleEntries: ComputedRef<Entry[]>;
  selectedEntry: ComputedRef<Entry | null>;
};

/** Everything the studio page derives from entries, folders and the current selection. */
export function useStudioData(): StudioData {
  const entriesStore = useEntriesStore();
  const foldersStore = useFoldersStore();
  const studio = useStudioStore();

  // Tree and counts follow the scope tab, so "Helfer" shows only folders that contain helpers.
  const scopedEntries = computed(() =>
    filterEntries(entriesStore.entries, {
      scope: studio.scope,
      category: CATEGORY_FILTER.all,
      search: "",
    }),
  );
  const tree = computed(() =>
    buildCategoryTree(
      scopedEntries.value.map((entry) => entry.categoryPath),
      foldersStore.folders,
    ),
  );
  // Suggestions and the rename preview cover every scope, because a rename affects all of them.
  const allCategoryPaths = computed(() =>
    flattenCategoryPaths(
      buildCategoryTree(
        entriesStore.entries.map((entry) => entry.categoryPath),
        foldersStore.folders,
      ),
    ),
  );
  const currentFolder = computed(() =>
    isSpecialCategory(studio.category) ? null : studio.category,
  );
  const uncategorizedCount = computed(
    () => scopedEntries.value.filter((entry) => entry.categoryPath === null).length,
  );
  const favoriteCount = computed(
    () => scopedEntries.value.filter((entry) => entry.isFavorite).length,
  );
  const scopeCounts = computed(() =>
    countByScope(
      filterEntries(entriesStore.entries, {
        scope: SCOPE_ALL,
        category: studio.category,
        search: studio.search,
      }),
    ),
  );
  const visibleEntries = computed(() =>
    filterEntries(entriesStore.entries, {
      scope: studio.scope,
      category: studio.category,
      search: studio.search,
    }),
  );
  const selectedEntry = computed(
    () => entriesStore.entries.find((entry) => entry.entityId === studio.selectedEntityId) ?? null,
  );

  return {
    scopedEntries,
    tree,
    allCategoryPaths,
    currentFolder,
    uncategorizedCount,
    favoriteCount,
    scopeCounts,
    visibleEntries,
    selectedEntry,
  };
}
