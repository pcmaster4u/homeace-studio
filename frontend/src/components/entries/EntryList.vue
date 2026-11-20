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
          </div>
        </div>
      </div>

      <label class="entry-list__search">
        <span class="mdi mdi-magnify" />
        <input v-model="search" type="search" :placeholder="t('list.search')" autocomplete="off" />
      </label>

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
      <p v-if="entries.length === 0" class="entry-list__empty">{{ t("list.empty") }}</p>

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
          :is-technical-details-visible="isTechnicalDetailsVisible"
          @select="(entityId) => emit('select', entityId)"
          @act="(item, action) => emit('act', item, action)"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import { computed, ref, useTemplateRef, watch } from "vue";
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
import {
  groupByCategory,
  isGroupOpenByDefault,
  isSpecialCategory,
  type EntryGroup,
} from "@/utils/entryFilter";

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
  isTechnicalDetailsVisible: boolean;
}>();

const emit = defineEmits<{
  select: [entityId: string];
  openNav: [];
  act: [entry: Entry, action: EntryAction];
  /** "Neu" was picked for this kind; the page opens the matching dialog. */
  create: [kind: NewEntryKind];
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
