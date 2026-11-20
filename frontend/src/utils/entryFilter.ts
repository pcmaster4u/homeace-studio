import { CATEGORY_FILTER, SCOPE_ALL, type EntryScope } from "@/constants/entries";
import type { Entry } from "@/types/entry";

import { isSameOrBelow } from "./categoryPath";

export type EntryFilter = {
  scope: EntryScope;
  /** A category path, or one of {@link CATEGORY_FILTER}. */
  category: string;
  search: string;
};

/**
 * Whether an entry belongs to a tree selection. A category includes everything below it:
 * "Haus" matches "Haus" and "Haus/Terrasse", but not "Hausflur".
 *
 * @param entry - The entry to check.
 * @param category - A category path or one of {@link CATEGORY_FILTER}.
 */
export function isInCategory(entry: Entry, category: string): boolean {
  if (category === CATEGORY_FILTER.all) return true;
  if (category === CATEGORY_FILTER.uncategorized) return entry.categoryPath === null;
  if (category === CATEGORY_FILTER.favorites) return entry.isFavorite;

  return entry.categoryPath !== null && isSameOrBelow(entry.categoryPath, category);
}

/** Whether a tree selection is one of the special nodes (all, favorites, uncategorized). */
export function isSpecialCategory(category: string): boolean {
  return (Object.values(CATEGORY_FILTER) as string[]).includes(category);
}

/**
 * Whether an entry matches a free-text search on name or entity ID (case-insensitive).
 *
 * @param entry - The entry to check.
 * @param search - User input; blank matches everything.
 */
export function matchesSearch(entry: Entry, search: string): boolean {
  const query = search.trim().toLowerCase();

  if (!query) return true;

  return entry.name.toLowerCase().includes(query) || entry.entityId.includes(query);
}

/**
 * Applies scope, tree selection and search to a list of entries.
 *
 * @returns Matching entries in their original order.
 */
export function filterEntries(entries: readonly Entry[], filter: EntryFilter): Entry[] {
  return entries.filter(
    (entry) =>
      (filter.scope === SCOPE_ALL || entry.kind === filter.scope) &&
      isInCategory(entry, filter.category) &&
      matchesSearch(entry, filter.search),
  );
}

/**
 * Counts entries per scope, for the numbers on the scope tabs.
 *
 * @returns One count per kind plus the total under {@link SCOPE_ALL}.
 */
export function countByScope(entries: readonly Entry[]): Record<EntryScope, number> {
  const counts: Record<EntryScope, number> = {
    all: entries.length,
    automation: 0,
    script: 0,
    scene: 0,
    helper: 0,
  };

  entries.forEach((entry) => counts[entry.kind]++);

  return counts;
}

export type EntryGroup = { path: string | null; entries: Entry[] };

/**
 * Groups entries by category path, sorted by path; uncategorized entries come last.
 *
 * @returns Groups in display order; entries keep their order inside a group.
 */
export function groupByCategory(entries: readonly Entry[]): EntryGroup[] {
  const groups = new Map<string | null, Entry[]>();

  entries.forEach((entry) => {
    const group = groups.get(entry.categoryPath) ?? [];
    group.push(entry);
    groups.set(entry.categoryPath, group);
  });

  const sortedPaths = [...groups.keys()].sort(compareCategoryPaths);

  return sortedPaths.map((path) => ({ path, entries: groups.get(path) ?? [] }));
}

function compareCategoryPaths(first: string | null, second: string | null): number {
  if (first === second) return 0;
  if (first === null) return 1;
  if (second === null) return -1;

  return first.localeCompare(second, undefined, { sensitivity: "base" });
}

type GroupContext = {
  /** Selected tree node: a category path or one of CATEGORY_FILTER. */
  category: string;
  selectedEntityId: string | null;
  isSearching: boolean;
  groupCount: number;
};

/**
 * Whether a group of the list starts expanded. Subfolders start collapsed so a folder reads as an
 * overview; the folder's own entries, the open entry and search results stay visible.
 *
 * @example isGroupOpenByDefault({ path: "Haus/Pool", entries }, { category: "Haus", … }) // false
 */
export function isGroupOpenByDefault(group: EntryGroup, context: GroupContext): boolean {
  if (context.isSearching || context.groupCount === 1) return true;
  if (group.entries.some((entry) => entry.entityId === context.selectedEntityId)) return true;
  if (!isSpecialCategory(context.category)) return group.path === context.category;

  // "All" lists every folder, so it starts as an overview too; favorites and "uncategorized" are short.
  return context.category !== CATEGORY_FILTER.all;
}
