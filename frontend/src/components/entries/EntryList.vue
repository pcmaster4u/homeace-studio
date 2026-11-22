<template>
  <section class="entry-list">
    <div class="entry-list__head">
      <div class="entry-list__title-row">
        <button
          class="icon-btn entry-list__nav-toggle"
          type="button"
          :aria-label="t('nav.open')"
          @click="emit('openNav')"
        >
          <span class="mdi mdi-menu" />
        </button>
        <div class="entry-list__title">
          <div v-if="title.crumb" class="entry-list__crumb">{{ title.crumb }} ›</div>
          <h2>{{ title.name }}</h2>
          <div class="entry-list__subtitle">{{ title.subtitle }}</div>
        </div>
        <div ref="newMenu" class="entry-list__new">
          <button
            class="btn btn--primary"
            type="button"
            :aria-expanded="isNewMenuOpen"
            aria-haspopup="menu"
            @click="isNewMenuOpen = !isNewMenuOpen"
          >
            <span class="mdi mdi-plus" />
            <span class="entry-list__new-label">{{ t("list.new") }}</span>
          </button>
          <div v-if="isNewMenuOpen" class="entry-list__new-menu" role="menu">
            <button
              v-for="kind in NEW_ENTRY_KINDS"
              :key="kind"
              type="button"
              role="menuitem"
              @click="pickNew(kind)"
            >
              <span class="entry-list__new-icon" :class="`kind-${kind}`">
                <span class="mdi" :class="ENTRY_KIND_ICON[kind]" />
              </span>
              {{ t(`list.newMenu.${kind}`) }}
            </button>
            <div class="entry-list__new-sep" role="separator" />
            <button type="button" role="menuitem" @click="pickFolder">
              <span class="entry-list__new-icon">
                <span class="mdi mdi-folder-plus-outline" />
              </span>
              {{ isRealCategory ? t("list.newSubfolder") : t("list.newFolder") }}
            </button>
          </div>
        </div>
      </div>

      <label class="entry-list__search">
        <span class="mdi mdi-magnify" />
        <input v-model="search" type="search" :placeholder="t('list.search')" autocomplete="off" />
      </label>

      <div
        v-if="checkedIds.size > 0"
        class="entry-list__bulk"
        role="toolbar"
        :aria-label="t('list.bulk')"
      >
        <b>{{ t("list.checkedCount", { count: checkedIds.size }) }}</b>
        <button class="btn btn--primary" type="button" @click="emit('moveChecked')">
          <span class="mdi mdi-folder-move-outline" />{{ t("list.moveTo") }}
        </button>
        <button class="btn" type="button" @click="emit('setAreaChecked')">
          <span class="mdi mdi-map-marker-outline" />{{ t("areas.set.button") }}
        </button>
        <button class="btn" type="button" @click="emit('uncategorizeChecked')">
          {{ t("list.takeOut") }}
        </button>
        <button class="btn entry-list__bulk-quiet" type="button" @click="checkAll">
          {{ t("list.checkAll") }}
        </button>
        <button
          class="icon-btn"
          type="button"
          :aria-label="t('list.clearChecked')"
          :title="t('list.clearChecked')"
          @click="emit('check', [...checkedIds], false)"
        >
          <span class="mdi mdi-close" />
        </button>
      </div>

      <div class="entry-list__scopes" role="tablist">
        <button
          v-for="option in ENTRY_SCOPES"
          :key="option"
          type="button"
          role="tab"
          :aria-selected="scope === option"
          :class="{ 'entry-list__scope--active': scope === option }"
          @click="scope = option"
        >
          {{ t(`scope.${option}`) }}<span>{{ scopeCounts[option] }}</span>
        </button>
      </div>
    </div>

    <div class="entry-list__body">
      <p v-if="entries.length === 0" class="entry-list__empty">
        {{ isRealCategory && !isSearching ? t("list.emptyFolder") : t("list.empty") }}
      </p>

      <template v-for="group in groups" :key="group.path ?? ''">
        <button
          type="button"
          class="entry-list__group"
          :aria-expanded="isOpen(group)"
          @click="toggleGroup(group)"
        >
          <span class="mdi" :class="isOpen(group) ? 'mdi-chevron-down' : 'mdi-chevron-right'" />
          <span class="entry-list__group-name">{{ groupLabel(group.path) }}</span>
          <span class="entry-list__group-line" />
          <span class="entry-list__group-count">{{ group.entries.length }}</span>
        </button>
        <EntryListRow
          v-for="entry in isOpen(group) ? group.entries : []"
          :key="entry.entityId"
          :entry="entry"
          :is-selected="entry.entityId === selectedEntityId"
          :has-unsaved-changes="unsavedIds.has(entry.entityId)"
          :is-checked="checkedIds.has(entry.entityId)"
          :is-check-active="checkedIds.size > 0"
          :area-note="areaView ? (areaView.notes[entry.entityId] ?? '') : undefined"
          :is-renaming="entry.entityId === renamingId"
          @start-rename="emit('startRename', entry.entityId)"
          @rename="(name) => emit('rename', entry.entityId, name)"
          @cancel-rename="emit('cancelRename')"
          @check="onCheck"
          :is-technical-details-visible="isTechnicalDetailsVisible"
          @select="(entityId) => emit('select', entityId)"
          @act="(item, action) => emit('act', item, action)"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onClickOutside, useEventListener } from "@vueuse/core";
import { computed, ref, useTemplateRef, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";

import {
  CATEGORY_FILTER,
  CATEGORY_SEPARATOR,
  ENTRY_KIND_ICON,
  ENTRY_SCOPES,
  NEW_ENTRY_KINDS,
  type EntryAction,
  type EntryScope,
  type NewEntryKind,
} from "@/constants/entries";
import type { Entry } from "@/types/entry";
import type { AreaListView } from "@/utils/areaNotes";
import {
  groupByCategory,
  isGroupOpenByDefault,
  isSpecialCategory,
  type EntryGroup,
} from "@/utils/entryFilter";

import { rangeBetween } from "@/utils/selection";

import EntryListRow from "./EntryListRow.vue";

const search = defineModel<string>("search", { required: true });
const scope = defineModel<EntryScope>("scope", { required: true });

const props = defineProps<{
  entries: Entry[];
  scopeCounts: Record<EntryScope, number>;
  /** Selected tree node: a category path or one of CATEGORY_FILTER. */
  category: string;
  selectedEntityId: string | null;
  /** Entries whose flow has unsaved edits. */
  unsavedIds: ReadonlySet<string>;
  /** Rows ticked for moving several entries at once. */
  checkedIds: ReadonlySet<string>;
  isTechnicalDetailsVisible: boolean;
  /** Set while an area of the area view is selected: its title and why each entry is in it. */
  areaView: AreaListView | null;
  /** The row whose name is being edited in place. */
  renamingId: string | null;
}>();

const emit = defineEmits<{
  select: [entityId: string];
  openNav: [];
  act: [entry: Entry, action: EntryAction];
  /** "Neu" was picked for this kind; the page opens the matching dialog. */
  create: [kind: NewEntryKind];
  /** New folder below `parent`; null for a top-level folder. */
  addFolder: [parent: string | null];
  /** Tick or untick rows. */
  check: [entityIds: string[], isChecked: boolean];
  moveChecked: [];
  uncategorizeChecked: [];
  /** "Bereich" for the ticked rows. */
  setAreaChecked: [];
  startRename: [entityId: string];
  rename: [entityId: string, name: string];
  cancelRename: [];
}>();

const { t } = useI18n();

const BREADCRUMB_SEPARATOR = " › ";

const isNewMenuOpen = ref(false);
const newMenu = useTemplateRef("newMenu");

onClickOutside(newMenu, () => (isNewMenuOpen.value = false));

function pickNew(kind: NewEntryKind): void {
  isNewMenuOpen.value = false;
  emit("create", kind);
}

function pickFolder(): void {
  isNewMenuOpen.value = false;
  addFolder();
}

const TYPING_TARGETS = ["INPUT", "TEXTAREA", "SELECT"];

/** Up and down walk through the open rows (and open the entry), like in a file manager. */
useEventListener(window, "keydown", (event: KeyboardEvent) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const target = event.target as HTMLElement | null;
  if (TYPING_TARGETS.includes(target?.tagName ?? "") || target?.closest("[role=dialog]")) return;

  const ids = groups.value
    .flatMap((group) => (isOpen(group) ? group.entries : []))
    .map((entry) => entry.entityId);
  if (ids.length === 0) return;

  const index = props.selectedEntityId ? ids.indexOf(props.selectedEntityId) : -1;
  const next =
    event.key === "ArrowDown" ? Math.min(ids.length - 1, index + 1) : Math.max(0, index - 1);
  const entityId = ids[next];
  if (!entityId || entityId === props.selectedEntityId) return;

  event.preventDefault();
  emit("select", entityId);
  void nextTick(() =>
    document
      .querySelector(`[data-entity-id="${CSS.escape(entityId)}"]`)
      ?.scrollIntoView({ block: "nearest" }),
  );
});

/** Rows in the order they are shown, for shift-click ranges and "select all". */
const visibleIds = computed(() =>
  groups.value
    .flatMap((group) => (isOpen(group) ? group.entries : []))
    .filter((entry) => entry.isInRegistry)
    .map((entry) => entry.entityId),
);
/** Last clicked checkbox; shift-click ticks everything from here. */
let checkAnchor: string | null = null;

function onCheck(entityId: string, withShift: boolean): void {
  const isChecked = !props.checkedIds.has(entityId);
  const ids = withShift ? rangeBetween(visibleIds.value, checkAnchor, entityId) : [entityId];

  // A range takes the state of the clicked row, so shift-click can also untick a range.
  emit("check", ids, isChecked);
  checkAnchor = entityId;
}

function checkAll(): void {
  emit("check", visibleIds.value, true);
}

/** Inside a folder the button makes a subfolder; elsewhere a top-level folder. */
function addFolder(): void {
  emit("addFolder", isRealCategory.value ? props.category : null);
}

const groups = computed(() => groupByCategory(props.entries));
const isRealCategory = computed(() => !isSpecialCategory(props.category));

/** Key for the group of entries without a category (its path is null). */
const NO_CATEGORY_KEY = "\u0000";

/** Groups the user opened or closed by hand; reset when another folder is selected. */
const toggledGroups = ref<Record<string, boolean>>({});

watch(
  () => props.category,
  () => (toggledGroups.value = {}),
);

const isSearching = computed(() => search.value.trim() !== "");

function isOpen(group: EntryGroup): boolean {
  // Search results are never hidden in a collapsed group.
  if (isSearching.value) return true;

  return (
    toggledGroups.value[group.path ?? NO_CATEGORY_KEY] ??
    isGroupOpenByDefault(group, {
      category: props.category,
      selectedEntityId: props.selectedEntityId,
      isSearching: isSearching.value,
      groupCount: groups.value.length,
    })
  );
}

function toggleGroup(group: EntryGroup): void {
  toggledGroups.value = {
    ...toggledGroups.value,
    [group.path ?? NO_CATEGORY_KEY]: !isOpen(group),
  };
}

const title = computed(() => {
  if (props.areaView)
    return { crumb: "", name: props.areaView.name, subtitle: props.areaView.subtitle };

  if (props.category === CATEGORY_FILTER.all) {
    return { crumb: "", name: t("nav.all"), subtitle: t("list.allSubtitle") };
  }

  if (props.category === CATEGORY_FILTER.favorites) {
    return { crumb: "", name: t("nav.favorites"), subtitle: t("list.favoritesSubtitle") };
  }

  if (props.category === CATEGORY_FILTER.uncategorized) {
    return { crumb: "", name: t("nav.uncategorized"), subtitle: t("list.uncategorizedSubtitle") };
  }

  const segments = props.category.split(CATEGORY_SEPARATOR);
  const name = segments.pop() ?? props.category;

  return {
    crumb: segments.join(BREADCRUMB_SEPARATOR),
    name,
    subtitle: t("list.inHa", { path: props.category }),
  };
});

/** Inside a selected category, group headers show the path relative to it. */
function groupLabel(path: string | null): string {
  if (path === null) return t("nav.uncategorized");
  if (!isRealCategory.value) return path.split(CATEGORY_SEPARATOR).join(BREADCRUMB_SEPARATOR);
  if (path === props.category) return t("list.directIn", { name: title.value.name });

  const relativePath = path.slice(props.category.length + CATEGORY_SEPARATOR.length);

  return relativePath.split(CATEGORY_SEPARATOR).join(BREADCRUMB_SEPARATOR);
}
</script>

<style scoped>
.entry-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.entry-list__head {
  display: grid;
  gap: 10px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--line);
}

.entry-list__title-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.entry-list__nav-toggle {
  display: none;
}

.entry-list__title {
  flex: 1;
  min-width: 0;
}

.entry-list__new {
  position: relative;
  flex: none;
}

.entry-list__new-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  display: grid;
  gap: 1px;
  min-width: 190px;
  padding: 6px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.entry-list__new-sep {
  height: 1px;
  margin: 4px 6px;
  background: var(--line);
}

.entry-list__new-menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border: 0;
  border-radius: 8px;
  background: none;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.entry-list__new-menu button:hover,
.entry-list__new-menu button:focus-visible {
  background: var(--sunken);
}

.entry-list__new-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  font-size: 17px;
}

.entry-list__crumb {
  color: var(--faint);
  font-size: 12px;
}

.entry-list__title h2 {
  margin: 0;
  font: 700 22px/1.15 var(--font-display);
  letter-spacing: -0.015em;
  text-wrap: balance;
}

.entry-list__subtitle {
  margin-top: 3px;
  color: var(--muted);
  font-size: 12.5px;
}

.entry-list__bulk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 8px 8px 12px;
  border-radius: 10px;
  background: var(--accent-soft);
}

.entry-list__bulk b {
  margin-right: auto;
  color: var(--accent);
  font-size: 13px;
}

.entry-list__bulk .btn {
  height: 30px;
  padding: 0 10px;
  font-size: 12.5px;
}

.entry-list__bulk-quiet {
  border-color: transparent;
  background: transparent;
}

.entry-list__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--faint);
  font-size: 18px;
}

.entry-list__search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.entry-list__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--fg);
  font-size: 14px;
}

.entry-list__scopes {
  display: flex;
  gap: 2px;
  padding: 3px;
  overflow-x: auto;
  /* Still scrolls by touch, wheel and keyboard; a bar would cover half the tabs. */
  scrollbar-width: none;
  border-radius: 9px;
  background: var(--sunken);
}

.entry-list__scopes button {
  flex: 1;
  padding: 5px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.entry-list__scopes button span {
  margin-left: 4px;
  color: var(--faint);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.entry-list__scopes .entry-list__scope--active {
  background: var(--surface);
  color: var(--fg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.entry-list__body {
  flex: 1;
  overflow: auto;
  padding: 6px 10px 30px;
}

.entry-list__group {
  display: flex;
  align-items: center;
  gap: 6px;
  width: calc(100% - 4px);
  margin: 10px 2px 4px;
  padding: 5px 6px;
  border: 0;
  border-radius: 7px;
  background: none;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.entry-list__group:hover {
  background: var(--sunken);
  color: var(--fg);
}

.entry-list__group .mdi {
  color: var(--faint);
  font-size: 16px;
}

.entry-list__group-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-list__group-line {
  flex: 1;
  height: 1px;
  background: var(--line);
}

.entry-list__group-count {
  color: var(--faint);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.entry-list__empty {
  padding: 40px 20px;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 1180px) {
  .entry-list__nav-toggle {
    display: inline-grid;
  }
}
</style>
