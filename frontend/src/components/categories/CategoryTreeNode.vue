<template>
  <li>
    <div
      class="category-tree-node"
      :class="{
        'category-tree-node--active': selected === node.path,
        'category-tree-node--drop': isDropOver,
      }"
      :style="{ '--depth': depth }"
      :title="node.isFolderOnly ? t('nav.folderOnly') : undefined"
      @click="emit('select', node.path)"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <button
        class="category-tree-node__twisty"
        :class="{ 'category-tree-node__twisty--hidden': !hasChildren }"
        type="button"
        tabindex="-1"
        :aria-label="isExpanded ? t('nav.collapse') : t('nav.expand')"
        @click.stop="emit('toggle', node.path)"
      >
        <span class="mdi" :class="isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'" />
      </button>
      <span
        class="mdi category-tree-node__icon"
        :class="node.isFolderOnly ? 'mdi-folder-outline' : 'mdi-folder'"
        :style="color ? { color } : undefined"
      />
      <span class="category-tree-node__name">{{ node.name }}</span>
      <span class="category-tree-node__count">{{ node.totalCount }}</span>
      <span class="category-tree-node__actions">
        <button
          class="category-tree-node__action"
          type="button"
          :aria-label="t('nav.newSubfolder', { name: node.name })"
          :title="t('nav.newSubfolder', { name: node.name })"
          @click.stop="emit('addFolder', node.path)"
        >
          <span class="mdi mdi-folder-plus-outline" />
        </button>
        <button
          class="category-tree-node__action"
          type="button"
          :aria-label="t('nav.color', { name: node.name })"
          :title="t('nav.color', { name: node.name })"
          @click.stop="emit('pickColor', node.path)"
        >
          <span class="mdi mdi-palette-outline" />
        </button>
        <button
          class="category-tree-node__action"
          type="button"
          :aria-label="t('nav.rename', { name: node.name })"
          :title="t('nav.rename', { name: node.name })"
          @click.stop="emit('rename', node.path)"
        >
          <span class="mdi mdi-pencil-outline" />
        </button>
        <button
          v-if="canDelete"
          class="category-tree-node__action"
          type="button"
          :aria-label="t('nav.deleteFolder', { name: node.name })"
          :title="t('nav.deleteFolder', { name: node.name })"
          @click.stop="emit('deleteFolder', node.path)"
        >
          <span class="mdi mdi-delete-outline" />
        </button>
      </span>
    </div>

    <ul v-if="hasChildren && isExpanded" class="category-tree-node__children">
      <CategoryTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :selected="selected"
        :expanded-paths="expandedPaths"
        :colors="colors"
        @select="(path) => emit('select', path)"
        @pick-color="(path) => emit('pickColor', path)"
        @toggle="(path) => emit('toggle', path)"
        @rename="(path) => emit('rename', path)"
        @add-folder="(path) => emit('addFolder', path)"
        @delete-folder="(path) => emit('deleteFolder', path)"
        @drop-entry="(path, entityId) => emit('dropEntry', path, entityId)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useEntryDropTarget } from "@/composables/useEntryDropTarget";
import { folderColor } from "@/utils/categoryPath";
import type { CategoryNode } from "@/utils/categoryTree";

const props = defineProps<{
  node: CategoryNode;
  depth: number;
  selected: string;
  expandedPaths: ReadonlySet<string>;
  /** Folder path to "#rrggbb" (own colors, overlay). */
  colors: Record<string, string>;
}>();

const emit = defineEmits<{
  select: [path: string];
  toggle: [path: string];
  rename: [path: string];
  addFolder: [parent: string];
  deleteFolder: [path: string];
  pickColor: [path: string];
  dropEntry: [path: string, entityId: string];
}>();

const { t } = useI18n();
const { isDropOver, onDragOver, onDragLeave, onDrop } = useEntryDropTarget((entityId) =>
  emit("dropEntry", props.node.path, entityId),
);

const hasChildren = computed(() => props.node.children.length > 0);
/** Own color, or the one inherited from the nearest colored parent folder. */
const color = computed(() => folderColor(props.node.path, props.colors));
const isExpanded = computed(() => props.expandedPaths.has(props.node.path));
/** Only a user's empty folder can be deleted; folders with entries vanish with their last entry. */
const canDelete = computed(
  () => props.node.isSavedFolder && props.node.totalCount === 0 && !hasChildren.value,
);
</script>

<style scoped>
.category-tree-node__children {
  margin: 0;
  padding: 0;
  list-style: none;
}

.category-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 4px 0 calc(4px + var(--depth) * 16px);
  border-radius: var(--radius-sm);
  cursor: pointer;
  user-select: none;
}

.category-tree-node:hover {
  background: var(--sunken);
}

.category-tree-node--active {
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--line-strong);
}

.category-tree-node--active .category-tree-node__name {
  font-weight: 600;
}

.category-tree-node--drop {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 2px var(--accent);
}

.category-tree-node__twisty,
.category-tree-node__action {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: none;
  color: var(--faint);
  cursor: pointer;
  font-size: 17px;
}

.category-tree-node__twisty:hover,
.category-tree-node__action:hover {
  background: var(--line);
  color: var(--fg);
}

.category-tree-node__twisty--hidden {
  visibility: hidden;
}

/* The actions replace the count on hover; on touch both stay visible. */
.category-tree-node__actions {
  display: none;
  gap: 1px;
}

.category-tree-node:hover .category-tree-node__actions,
.category-tree-node:focus-within .category-tree-node__actions {
  display: flex;
}

.category-tree-node:hover .category-tree-node__count {
  display: none;
}

.category-tree-node__icon {
  color: var(--faint);
  font-size: 17px;
}

.category-tree-node__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.category-tree-node__count {
  min-width: 22px;
  padding-right: 4px;
  color: var(--faint);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

@media (hover: none) {
  .category-tree-node__actions {
    display: flex;
  }

  .category-tree-node:hover .category-tree-node__count {
    display: inline;
  }
}

@media (pointer: coarse) {
  .category-tree-node {
    height: 40px;
  }

  .category-tree-node__twisty,
  .category-tree-node__action {
    width: 32px;
    height: 32px;
  }
}
</style>
