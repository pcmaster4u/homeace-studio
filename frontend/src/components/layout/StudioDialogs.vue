<template>
  <RenameCategoryDialog
    v-if="actions.renamingPath.value"
    :folder-path="actions.renamingPath.value"
    :all-paths="allPaths"
    :is-busy="actions.isBusy.value"
    @cancel="actions.cancelRename"
    @confirm="actions.confirmRename"
  />
  <NewFolderDialog
    v-if="create.folderDraft.value"
    :parent="create.folderDraft.value.parent"
    :all-paths="allPaths"
    :is-busy="create.isBusy.value"
    @cancel="create.cancelFolder"
    @confirm="create.confirmFolder"
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
    :confirm-label="t('delete.confirm')"
    :is-busy="entryActions.isBusy.value"
    @cancel="entryActions.cancelDelete"
    @confirm="entryActions.confirmDelete"
  />
  <FolderColorDialog
    v-if="colorPath"
    :path="colorPath"
    :current="foldersStore.colors[colorPath] ?? null"
    @cancel="emit('closeColor')"
    @pick="pickColor"
  />
  <ToastHost />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import FolderColorDialog from "@/components/categories/FolderColorDialog.vue";
import NewFolderDialog from "@/components/categories/NewFolderDialog.vue";
import RenameCategoryDialog from "@/components/categories/RenameCategoryDialog.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import ToastHost from "@/components/common/ToastHost.vue";
import NewFlowDialog from "@/components/flow/NewFlowDialog.vue";
import NewHelperDialog from "@/components/helpers/NewHelperDialog.vue";
import type { useCategoryActions } from "@/composables/useCategoryActions";
import type { useCreateActions } from "@/composables/useCreateActions";
import type { useEntryActions } from "@/composables/useEntryActions";
import type { NewFlow } from "@/services/flowsService";
import type { NewHelper } from "@/services/helpersService";
import { useFoldersStore } from "@/stores/foldersStore";

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
}>();

const { t } = useI18n();
const foldersStore = useFoldersStore();

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
