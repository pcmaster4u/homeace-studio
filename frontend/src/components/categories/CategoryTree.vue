<template>
  <nav class="category-tree" :aria-label="t('nav.categories')">
    <div
      class="category-tree__special"
      :class="{ 'category-tree__special--active': selected === CATEGORY_FILTER.all }"
      @click="emit('select', CATEGORY_FILTER.all)"
    >
      <span class="mdi mdi-apps" />
      <span>{{ t("nav.all") }}</span>
      <span class="category-tree__count">{{ totalCount }}</span>
    </div>

    <div
      class="category-tree__special"
      :class="{ 'category-tree__special--active': selected === CATEGORY_FILTER.favorites }"
      @click="emit('select', CATEGORY_FILTER.favorites)"
    >
      <span class="mdi mdi-star-outline" />
      <span>{{ t("nav.favorites") }}</span>
      <span class="category-tree__count">{{ favoriteCount }}</span>
    </div>

    <div class="category-tree__heading">
      <span>{{ t("nav.categories") }}</span>
      <button
        class="category-tree__add"
        type="button"
        :aria-label="t('nav.newFolder')"
        :title="t('nav.newFolder')"
        @click="emit('addFolder', null)"
      >
        <span class="mdi mdi-folder-plus-outline" />
      </button>
    </div>

    <!-- Hints above the folders, e.g. the tidy-up assistant. -->
    <slot name="notices" />

    <ul class="category-tree__list">
      <CategoryTreeNode
        v-for="node in tree"
        :key="node.path"
        :node="node"
        :depth="0"
        :selected="selected"
        :expanded-paths="expandedPaths"
        :colors="colors"
        @select="selectNode"
        @pick-color="(path) => emit('pickColor', path)"
        @toggle="toggleNode"
        @rename="(path) => emit('rename', path)"
        @add-folder="(path) => emit('addFolder', path)"
        @delete-folder="(path) => emit('deleteFolder', path)"
        @drop-entry="(path, entityId) => emit('dropEntry', path, entityId)"
      />
    </ul>

    <div
      class="category-tree__special"
      :class="{
        'category-tree__special--active': selected === CATEGORY_FILTER.uncategorized,
        'category-tree__special--drop': isDropOverUncategorized,
      }"
      @click="emit('select', CATEGORY_FILTER.uncategorized)"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <span class="mdi mdi-folder-off-outline" />
      <span>{{ t("nav.uncategorized") }}</span>
      <span class="category-tree__count">{{ uncategorizedCount }}</span>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useEntryDropTarget } from "@/composables/useEntryDropTarget";
import { CATEGORY_FILTER, CATEGORY_SEPARATOR } from "@/constants/entries";
import type { CategoryNode } from "@/utils/categoryTree";

import CategoryTreeNode from "./CategoryTreeNode.vue";

const props = defineProps<{
  tree: CategoryNode[];
  selected: string;
  totalCount: number;
  uncategorizedCount: number;
  favoriteCount: number;
  colors: Record<string, string>;
}>();

const emit = defineEmits<{
  select: [path: string];
  rename: [path: string];
  /** `parent` null: a new top-level folder. */
  addFolder: [parent: string | null];
  deleteFolder: [path: string];
  pickColor: [path: string];
  /** `path` null: the entry was dropped on "Ohne Kategorie". */
  dropEntry: [path: string | null, entityId: string];
}>();

const { t } = useI18n();
const {
  isDropOver: isDropOverUncategorized,
  onDragOver,
  onDragLeave,
  onDrop,
} = useEntryDropTarget((entityId) => emit("dropEntry", null, entityId));

/** Which folders are open is pure UI state of this tree. */
const expandedPaths = ref(new Set<string>());

function toggleNode(path: string): void {
  const next = new Set(expandedPaths.value);

  if (next.has(path)) {
    next.delete(path);
  } else {
    next.add(path);
  }

  expandedPaths.value = next;
}

/** A folder selected from elsewhere (a new folder, the list) opens the tree down to it. */
watch(
  () => props.selected,
  (path) => {
    if ((Object.values(CATEGORY_FILTER) as string[]).includes(path)) return;

    const levels = path.split(CATEGORY_SEPARATOR);
    const next = new Set(expandedPaths.value);

    for (let depth = 1; depth <= levels.length; depth++) {
      next.add(levels.slice(0, depth).join(CATEGORY_SEPARATOR));
    }

    expandedPaths.value = next;
  },
);

/** Selecting a folder also opens it, so its subfolders become visible. */
function selectNode(path: string): void {
  expandedPaths.value = new Set(expandedPaths.value).add(path);
  emit("select", path);
}
</script>

<style scoped>
.category-tree {
  display: grid;
  gap: 2px;
}

.category-tree__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 6px 6px;
  color: var(--faint);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.category-tree__add {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--faint);
  cursor: pointer;
  font-size: 17px;
}

.category-tree__add:hover {
  background: var(--line);
  color: var(--fg);
}

.category-tree__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.category-tree__special {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 32px;
  padding: 0 8px;
  border-radius: var(--radius-sm);
  color: var(--muted);
  cursor: pointer;
}

.category-tree__special .mdi {
  color: var(--faint);
  font-size: 17px;
}

.category-tree__special > span:nth-child(2) {
  flex: 1;
}

.category-tree__special:hover {
  background: var(--sunken);
}

.category-tree__special--active {
  background: var(--surface);
  color: var(--fg);
  font-weight: 600;
  box-shadow: inset 0 0 0 1px var(--line-strong);
}

.category-tree__special--drop {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 2px var(--accent);
}

.category-tree__count {
  color: var(--faint);
  font-size: 12px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}
</style>
