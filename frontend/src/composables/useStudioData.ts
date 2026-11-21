import { computed, type ComputedRef } from "vue";

import { CATEGORY_FILTER, SCOPE_ALL, type EntryScope } from "@/constants/entries";
import { useEntriesStore } from "@/stores/entriesStore";
import { useEntryAreasStore } from "@/stores/entryAreasStore";
import { useFoldersStore } from "@/stores/foldersStore";
import { useLookupsStore } from "@/stores/lookupsStore";
import { useStudioStore } from "@/stores/studioStore";
import type { Entry } from "@/types/entry";
import { buildCategoryTree, flattenCategoryPaths, type CategoryNode } from "@/utils/categoryTree";
import { countByScope, filterEntries, isSpecialCategory } from "@/utils/entryFilter";

/** One area in the tree of the area view. */
export type AreaNavItem = { areaId: string; name: string; count: number };

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
  /** Areas that have entries in the current scope, in HA order. */
  areaNav: ComputedRef<AreaNavItem[]>;
  /** Entries of the current scope without any area. */
  noAreaCount: ComputedRef<number>;
  selectedEntry: ComputedRef<Entry | null>;
};

/** Everything the studio page derives from entries, folders and the current selection. */
export function useStudioData(): StudioData {
  const entriesStore = useEntriesStore();
  const foldersStore = useFoldersStore();
  const studio = useStudioStore();
  const entryAreas = useEntryAreasStore();
  const lookups = useLookupsStore();
  const areaIdsOf = (entityId: string): string[] =>
    entryAreas.linksOf(entityId).map((link) => link.areaId);

  // Counts follow the scope tab; the folders themselves stay, so the tree keeps its shape.
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
      entriesStore.entries.map((entry) => entry.categoryPath),
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
        areaIdsOf,
      }),
    ),
  );
  const visibleEntries = computed(() =>
    filterEntries(entriesStore.entries, {
      scope: studio.scope,
      category: studio.category,
      search: studio.search,
      areaIdsOf,
    }),
  );
  const areaNav = computed(() => {
    const counts = new Map<string, number>();
    const names = new Map(lookups.areas.map((area) => [area.areaId, area.name]));

    for (const entry of scopedEntries.value) {
      for (const link of entryAreas.linksOf(entry.entityId)) {
        counts.set(link.areaId, (counts.get(link.areaId) ?? 0) + 1);
        if (!names.has(link.areaId)) names.set(link.areaId, link.name);
      }
    }

    return [...names]
      .filter(([areaId]) => counts.has(areaId))
      .map(([areaId, name]) => ({ areaId, name, count: counts.get(areaId) ?? 0 }));
  });
  const noAreaCount = computed(
    () => scopedEntries.value.filter((entry) => areaIdsOf(entry.entityId).length === 0).length,
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
    areaNav,
    noAreaCount,
    selectedEntry,
  };
}
