<template>
  <div
    class="studio-view"
    :class="{ 'studio-view--nav-open': isNavOpen, 'studio-view--detail-open': isDetailOpen }"
    :style="{
      '--w-nav': `${settings.paneWidths.nav}px`,
      '--w-list': `${settings.paneWidths.list}px`,
    }"
  >
    <AppTopBar
      :status="connectionStatus"
      :is-live="isLive"
      :entry-count="entriesStore.entries.length"
    />

    <div v-if="entriesStore.hasLoadError" class="studio-view__error" role="alert">
      <span class="mdi mdi-lan-disconnect" />
      {{ t("errors.loadFailed") }}
      <button class="btn" type="button" @click="entriesStore.load()">
        {{ t("errors.retry") }}
      </button>
    </div>

    <main class="studio-view__panes">
      <aside class="studio-view__nav">
        <CategoryTree
          :tree="data.tree.value"
          :selected="studio.category"
          :total-count="data.scopedEntries.value.length"
          :uncategorized-count="data.uncategorizedCount.value"
          :favorite-count="data.favoriteCount.value"
          :colors="foldersStore.colors"
          @select="selectCategory"
          @rename="actions.startRename"
          @drop-entry="(path, entityId) => actions.moveEntry(entityId, path)"
          @add-folder="create.startFolder"
          @delete-folder="create.deleteFolder"
          @pick-color="(path) => (colorPath = path)"
        >
          <template #notices>
            <AiPlanHint />
            <CleanupHint v-if="cleanup.isHintVisible" />
          </template>
        </CategoryTree>
      </aside>
      <PaneSplitter
        v-model="navWidth"
        class="studio-view__splitter-nav"
        :label="t('nav.resize')"
        :min="PANE_WIDTH_LIMITS.nav.min"
        :max="PANE_WIDTH_LIMITS.nav.max"
        @reset="settings.resetPaneWidth(PANE.nav)"
      />

      <div class="studio-view__list">
        <EntryList
          v-model:search="studio.search"
          v-model:scope="studio.scope"
          :entries="data.visibleEntries.value"
          :scope-counts="data.scopeCounts.value"
          :category="studio.category"
          :selected-entity-id="studio.selectedEntityId"
          :unsaved-ids="editorStore.unsavedIds"
          :is-technical-details-visible="settings.isTechnicalDetailsVisible"
          @select="selectEntry"
          @open-nav="isNavOpen = true"
          @create="onCreate"
          @add-folder="create.startFolder"
          @act="entryActions.act"
        />
      </div>
      <PaneSplitter
        v-model="listWidth"
        class="studio-view__splitter-list"
        :label="t('list.resize')"
        :min="PANE_WIDTH_LIMITS.list.min"
        :max="PANE_WIDTH_LIMITS.list.max"
        @reset="settings.resetPaneWidth(PANE.list)"
      />

      <div class="studio-view__detail">
        <EntryDetail
          :entry="data.selectedEntry.value"
          :is-technical-details-visible="settings.isTechnicalDetailsVisible"
          :all-category-paths="data.allCategoryPaths.value"
          :areas="lookups.areas"
          :labels="lookups.labels"
          :is-busy="isBusy"
          :display-flow="displayFlow"
          :catalog="editorStore.catalogs[settings.locale] ?? null"
          :is-flow-loading="editorStore.isFlowLoading"
          :has-flow-error="editorStore.hasFlowError"
          :is-flow-editable="editorStore.flow?.isEditable ?? false"
          :has-unsaved-changes="editorStore.isDirty"
          :has-remote-change="editorStore.hasRemoteChange"
          :is-flow-saving="editorStore.isSaving"
          @back="isDetailOpen = false"
          @move="onMove"
          @save="onSave"
          @act="onAct"
          @toggle-favorite="onToggleFavorite"
          @save-note="onSaveNote"
          @delete="onDelete"
          @change-flow="editorStore.applyChange"
          @save-flow="onSaveFlow"
          @discard-flow="editorStore.discard"
        />
      </div>
    </main>

    <div class="studio-view__scrim" @click="isNavOpen = false" />

    <StudioDialogs
      :all-paths="data.allCategoryPaths.value"
      :current-folder="data.currentFolder.value"
      :color-path="colorPath"
      :actions="actions"
      :create="create"
      :entry-actions="entryActions"
      @close-color="colorPath = null"
      @created="selectEntry"
      @folder-created="selectCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import CategoryTree from "@/components/categories/CategoryTree.vue";
import AiPlanHint from "@/components/ai/AiPlanHint.vue";
import CleanupHint from "@/components/cleanup/CleanupHint.vue";
import EntryDetail from "@/components/entries/EntryDetail.vue";
import EntryList from "@/components/entries/EntryList.vue";
import AppTopBar, { type ConnectionStatus } from "@/components/layout/AppTopBar.vue";
import PaneSplitter from "@/components/layout/PaneSplitter.vue";
import { useCategoryActions } from "@/composables/useCategoryActions";
import { useCreateActions } from "@/composables/useCreateActions";
import { useEntryActions } from "@/composables/useEntryActions";
import { useFlowTexts } from "@/composables/useFlowTexts";
import { useLiveUpdates } from "@/composables/useLiveUpdates";
import { useStudioData } from "@/composables/useStudioData";
import { NEW_ENTRY_KIND, type EntryAction, type NewEntryKind } from "@/constants/entries";
import { PANE, PANE_WIDTH_LIMITS } from "@/constants/layout";
import { useAiStore } from "@/stores/aiStore";
import { useCleanupStore } from "@/stores/cleanupStore";
import { useEditorStore } from "@/stores/editorStore";
import { useEntriesStore } from "@/stores/entriesStore";
import { useFoldersStore } from "@/stores/foldersStore";
import { useLookupsStore } from "@/stores/lookupsStore";
import { useMessagesStore } from "@/stores/messagesStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStudioStore } from "@/stores/studioStore";
import { useToastStore } from "@/stores/toastStore";
import type { Entry, EntryChanges } from "@/types/entry";
import { toDisplayFlow } from "@/utils/flow/toDisplayFlow";

import StudioDialogs from "@/components/layout/StudioDialogs.vue";

const { t } = useI18n();
const entriesStore = useEntriesStore();
const foldersStore = useFoldersStore();
const lookups = useLookupsStore();
const settings = useSettingsStore();
const studio = useStudioStore();
const data = useStudioData();
const actions = useCategoryActions();
const create = useCreateActions();
const entryActions = useEntryActions();
const { isLive } = useLiveUpdates();
const editorStore = useEditorStore();
const flowTexts = useFlowTexts();
const toasts = useToastStore();
const messages = useMessagesStore();
const cleanup = useCleanupStore();
const ai = useAiStore();

/** Kinds whose flow the detail view shows. */
const FLOW_KINDS = ["automation", "script"];

// Opening an automation or script loads its flow; anything else clears it.
watch(
  () => data.selectedEntry.value?.entityId,
  (entityId) => {
    const entry = data.selectedEntry.value;

    if (entityId && entry && FLOW_KINDS.includes(entry.kind)) {
      void editorStore.loadFlow(entityId);
    } else {
      editorStore.clearFlow();
    }
  },
  { immediate: true },
);

// Block names come from HA in the UI language.
watch(
  () => settings.locale,
  (language) => void editorStore.loadCatalog(language),
  { immediate: true },
);

const displayFlow = computed(() => {
  const flow = editorStore.editedFlow;

  if (!flow || flow.entityId !== data.selectedEntry.value?.entityId) return null;

  // Entities picked in the editor are not in the flow's own name list yet; areas show by name.
  const areaNames = Object.fromEntries(lookups.areas.map((area) => [area.areaId, area.name]));
  const entityNames = { ...areaNames, ...lookups.entityNames, ...flow.entityNames };

  return toDisplayFlow(
    { ...flow, entityNames },
    editorStore.catalogs[settings.locale] ?? null,
    flowTexts.value,
  );
});

// Unsaved edits live only in this tab; the browser asks before they are lost.
useEventListener(window, "beforeunload", (event: BeforeUnloadEvent) => {
  if (editorStore.unsavedIds.size > 0) event.preventDefault();
});

/** Only used on narrow screens (CSS decides): nav as drawer, detail as full-screen layer. */
const isNavOpen = ref(false);
const isDetailOpen = ref(false);
/** The folder whose color dialog is open; null when closed. */
const colorPath = ref<string | null>(null);

const isBusy = computed(() => actions.isBusy.value || entryActions.isBusy.value);

/** Wraps a detail handler so it only runs while an entry is open (the detail is empty otherwise). */
function onSelected<Args extends unknown[]>(
  handler: (entry: Entry, ...args: Args) => Promise<unknown> | void,
): (...args: Args) => void {
  return (...args) => {
    const entry = data.selectedEntry.value;

    if (entry) void handler(entry, ...args);
  };
}

const onMove = onSelected((entry, path: string | null) => actions.moveEntry(entry.entityId, path));
const onSave = onSelected((entry, changes: EntryChanges) =>
  entryActions.save(entry.entityId, changes),
);
const onAct = onSelected((entry, action: EntryAction) => entryActions.act(entry, action));
const onToggleFavorite = onSelected((entry) => entryActions.toggleFavorite(entry));
const onSaveNote = onSelected((entry, note: string) => entryActions.saveNote(entry, note));
const onDelete = onSelected((entry) => entryActions.askDelete(entry));
const onSaveFlow = onSelected(async (entry) => {
  try {
    await editorStore.save();
    toasts.show(t("toast.flowSaved", { name: entry.name }));
  } catch (error) {
    toasts.show(messages.textFor(error, t("errors.actionFailed")), "error");
  }
});

const navWidth = computed({
  get: () => settings.paneWidths.nav,
  set: (width: number) => settings.setPaneWidth(PANE.nav, width),
});
const listWidth = computed({
  get: () => settings.paneWidths.list,
  set: (width: number) => settings.setPaneWidth(PANE.list, width),
});

const connectionStatus = computed<ConnectionStatus>(() => {
  if (entriesStore.hasLoadError) return "failed";
  if (entriesStore.isLoading) return "loading";

  return "connected";
});

function selectCategory(path: string): void {
  studio.selectCategory(path);
  isNavOpen.value = false;
}

/** "Neu" in the list: automations and scripts get a name dialog, helpers their own dialog. */
function onCreate(kind: NewEntryKind): void {
  if (kind === NEW_ENTRY_KIND.helper) create.openHelperDialog();
  else create.openFlowDialog(kind);
}

function selectEntry(entityId: string): void {
  studio.selectEntry(entityId);
  isDetailOpen.value = true;
}

// Proposals follow the categories: after moves, renames and live updates from HA.
watch(
  () => entriesStore.entries,
  () => void cleanup.load(),
);

onMounted(() => {
  void entriesStore.load();
  void foldersStore.load();
  void lookups.load();
  void ai.loadPlans();
});
</script>

<style scoped>
.studio-view {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  height: 100%;
}

/*
 * Fixed rows: without them the panes slid into the banner's row whenever there is no error, and
 * the empty last row left a strip at the bottom.
 */
.studio-view__error {
  grid-row: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--err-soft);
  color: var(--err);
  font-weight: 600;
}

/*
 * nav | splitter | list | splitter | detail; splitters take no width of their own.
 * min() keeps at least 380px for the detail, whatever width the list was dragged to.
 */
.studio-view__panes {
  grid-row: 3;
  display: grid;
  grid-template-columns:
    var(--w-nav) 0 min(var(--w-list), calc(100vw - var(--w-nav) - 380px))
    0 minmax(0, 1fr);
  min-height: 0;
}

.studio-view__nav {
  min-height: 0;
  overflow: auto;
  padding: 14px 12px 24px max(12px, env(safe-area-inset-left, 0px));
  border-right: 1px solid var(--line);
  background: var(--surface-2);
}

.studio-view__list {
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid var(--line);
}

.studio-view__detail {
  min-height: 0;
  overflow: hidden;
  padding-right: env(safe-area-inset-right, 0px);
}

.studio-view__scrim {
  display: none;
}

/* Tablet: categories become a drawer. */
@media (max-width: 1180px) {
  .studio-view__panes {
    grid-template-columns: min(var(--w-list), calc(100vw - 380px)) 0 minmax(0, 1fr);
  }

  .studio-view__nav {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 60;
    width: min(var(--w-nav), 86vw);
    padding-top: calc(14px + env(safe-area-inset-top, 0px));
    box-shadow: var(--shadow);
    transform: translateX(-102%);
    transition: transform 0.22s ease;
  }

  .studio-view--nav-open .studio-view__nav {
    transform: none;
  }

  .studio-view__splitter-nav {
    display: none;
  }

  .studio-view--nav-open .studio-view__scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 55;
    background: var(--scrim);
  }
}

/* Phone: list first, the detail slides in full screen. */
@media (max-width: 820px) {
  .studio-view__panes {
    grid-template-columns: minmax(0, 1fr);
  }

  .studio-view__list {
    border-right: 0;
  }

  .studio-view__splitter-list {
    display: none;
  }

  .studio-view__detail {
    position: fixed;
    inset: 0;
    z-index: 40;
    padding-top: env(safe-area-inset-top, 0px);
    background: var(--bg);
    transform: translateX(102%);
    transition: transform 0.24s ease;
  }

  .studio-view--detail-open .studio-view__detail {
    transform: none;
  }
}
</style>
