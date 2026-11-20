<template>
  <RenameCategoryDialog
    v-if="actions.renamingPath.value"
    :folder-path="actions.renamingPath.value"
    :all-paths="allPaths"
    :is-busy="actions.isBusy.value"
    @cancel="actions.cancelRename"
    @confirm="actions.confirmRename"
  />
  <MoveEntriesDialog
    v-if="actions.movingIds.value"
    :count="actions.movingIds.value.length"
    :all-paths="allPaths"
    :is-busy="actions.isBusy.value"
    @cancel="actions.cancelMoveMany"
    @confirm="(path) => actions.moveEntries(actions.movingIds.value ?? [], path)"
  />
  <NewFolderDialog
    v-if="create.folderDraft.value"
    :parent="create.folderDraft.value.parent"
    :all-paths="allPaths"
    :is-busy="create.isBusy.value"
    @cancel="create.cancelFolder"
    @confirm="createFolder"
  />
  <NewHelperDialog
    v-if="create.isHelperDialogOpen.value"
    :initial-folder="currentFolder"
    :all-paths="allPaths"
    :is-busy="create.isBusy.value"
    @cancel="create.closeHelperDialog"
    @confirm="createHelper"
  />
  <NewFlowDialog
    v-if="create.newFlowKind.value"
    :kind="create.newFlowKind.value"
    :initial-folder="currentFolder"
    :all-paths="allPaths"
    :is-busy="create.isBusy.value"
    @cancel="create.closeFlowDialog"
    @confirm="createFlow"
  />
  <ConfirmDialog
    v-if="entryActions.deletingEntry.value"
    :title="t(`delete.title.${entryActions.deletingEntry.value.kind}`)"
    :text="
      t(`delete.text.${entryActions.deletingEntry.value.kind}`, {
        name: entryActions.deletingEntry.value.name,
      })
    "
    :confirm-label="deleteUsers.length ? t('deps.deleteAnyway') : t('delete.confirm')"
    :is-busy="entryActions.isBusy.value"
    @cancel="entryActions.cancelDelete"
    @confirm="entryActions.confirmDelete"
  >
    <template v-if="deleteUsers.length">
      <p class="studio-dialogs__warn">{{ t("deps.deleteWarning") }}</p>
      <div class="studio-dialogs__users">
        <DependencyUserRow
          v-for="user in deleteUsers"
          :key="user.entityId"
          :user="user"
          :entry="entriesStore.entries.find((item) => item.entityId === user.entityId) ?? null"
          is-plain
        />
      </div>
    </template>
  </ConfirmDialog>
  <FolderColorDialog
    v-if="colorPath"
    :path="colorPath"
    :current="foldersStore.colors[colorPath] ?? null"
    @cancel="emit('closeColor')"
    @pick="pickColor"
  />
  <CleanupDialog
    v-if="cleanup.isOpen"
    :all-paths="allPaths"
    @close="cleanup.close()"
    @applied="onCleanedUp"
  />
  <McpSettingsDialog v-if="ai.isSettingsOpen" />
  <AiPlanDialog
    v-if="ai.reviewPlan"
    :key="ai.reviewPlan.id"
    :plan="ai.reviewPlan"
    :all-paths="allPaths"
    @applied="onPlanApplied"
  />
  <ToastHost />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import AiPlanDialog from "@/components/ai/AiPlanDialog.vue";
import McpSettingsDialog from "@/components/ai/McpSettingsDialog.vue";
import CleanupDialog from "@/components/cleanup/CleanupDialog.vue";
import FolderColorDialog from "@/components/categories/FolderColorDialog.vue";
import NewFolderDialog from "@/components/categories/NewFolderDialog.vue";
import RenameCategoryDialog from "@/components/categories/RenameCategoryDialog.vue";
import MoveEntriesDialog from "@/components/entries/MoveEntriesDialog.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import DependencyUserRow from "@/components/dependencies/DependencyUserRow.vue";
import ToastHost from "@/components/common/ToastHost.vue";
import NewFlowDialog from "@/components/flow/NewFlowDialog.vue";
import NewHelperDialog from "@/components/helpers/NewHelperDialog.vue";
import type { useCategoryActions } from "@/composables/useCategoryActions";
import type { useCreateActions } from "@/composables/useCreateActions";
import type { useEntryActions } from "@/composables/useEntryActions";
import type { NewFlow } from "@/services/flowsService";
import type { NewHelper } from "@/services/helpersService";
import { useAiStore } from "@/stores/aiStore";
import { useCleanupStore } from "@/stores/cleanupStore";
import { useDependenciesStore } from "@/stores/dependenciesStore";
import { useEntriesStore } from "@/stores/entriesStore";
import { useFoldersStore } from "@/stores/foldersStore";
import { useToastStore } from "@/stores/toastStore";

/** All dialogs and toasts of the studio page, kept out of the page to keep it readable. */
const props = defineProps<{
  allPaths: string[];
  currentFolder: string | null;
  /** The folder whose color dialog is open; null when closed. */
  colorPath: string | null;
  actions: ReturnType<typeof useCategoryActions>;
  create: ReturnType<typeof useCreateActions>;
  entryActions: ReturnType<typeof useEntryActions>;
}>();

const emit = defineEmits<{
  closeColor: [];
  /** A new helper, automation or script exists; the page opens it. */
  created: [entityId: string];
  /** A new folder exists; the page opens it. */
  folderCreated: [path: string];
}>();

const { t } = useI18n();
const foldersStore = useFoldersStore();
const cleanup = useCleanupStore();
const entriesStore = useEntriesStore();
const toasts = useToastStore();
const ai = useAiStore();
const dependencies = useDependenciesStore();

/** Who still uses the entry about to be deleted (it is the open one, so its dependencies are loaded). */
const deleteUsers = computed(() => {
  const entityId = props.entryActions.deletingEntry.value?.entityId;
  const current = dependencies.current;
  return entityId && current?.entityId === entityId ? current.usedBy : [];
});

async function onPlanApplied(): Promise<void> {
  // Renamed folders keep their colors and empty subfolders in the overlay.
  await Promise.all([entriesStore.load(), foldersStore.load()]);
}

async function onCleanedUp(categoryCount: number): Promise<void> {
  cleanup.close();
  toasts.show(t("toast.cleanedUp", { count: categoryCount }, categoryCount));
  await entriesStore.load();
}

async function createFolder(path: string): Promise<void> {
  const storedPath = await props.create.confirmFolder(path);

  if (storedPath) emit("folderCreated", storedPath);
}

async function createHelper(helper: NewHelper): Promise<void> {
  const entityId = await props.create.confirmHelper(helper);

  if (entityId) emit("created", entityId);
}

async function createFlow(flow: NewFlow): Promise<void> {
  const entityId = await props.create.confirmFlow(flow);

  if (entityId) emit("created", entityId);
}

async function pickColor(color: string | null): Promise<void> {
  if (!props.colorPath) return;

  await props.entryActions.setFolderColor(props.colorPath, color);
  emit("closeColor");
}
</script>

<style scoped>
.studio-dialogs__warn {
  margin: 14px 0 8px;
  color: var(--fg);
  font-weight: 600;
}

.studio-dialogs__users {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 10px;
}
</style>
