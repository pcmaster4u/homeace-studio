import { ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";

import { useEntriesStore } from "@/stores/entriesStore";
import { useFoldersStore } from "@/stores/foldersStore";
import { useMessagesStore } from "@/stores/messagesStore";
import { useToastStore } from "@/stores/toastStore";

type CategoryActions = {
  /** A move or rename is running; controls lock meanwhile. */
  isBusy: Ref<boolean>;
  /** The folder in the rename dialog; null when the dialog is closed. */
  renamingPath: Ref<string | null>;
  moveEntry: (entityId: string, categoryPath: string | null) => Promise<void>;
  startRename: (path: string) => void;
  cancelRename: () => void;
  confirmRename: (newPath: string) => Promise<void>;
};

/**
 * Moving entries and renaming folders, with feedback as toasts.
 * Errors from the backend are shown with the text from its catalog.
 */
export function useCategoryActions(): CategoryActions {
  const { t } = useI18n();
  const entriesStore = useEntriesStore();
  const foldersStore = useFoldersStore();
  const messages = useMessagesStore();
  const toasts = useToastStore();

  const isBusy = ref(false);
  const renamingPath = ref<string | null>(null);

  function showError(error: unknown): void {
    toasts.show(messages.textFor(error, t("errors.actionFailed")), "error");
  }

  async function moveEntry(entityId: string, categoryPath: string | null): Promise<void> {
    const entry = entriesStore.entries.find((item) => item.entityId === entityId);

    // Dropping an entry on the folder it is already in does nothing.
    if (!entry || entry.categoryPath === categoryPath) return;

    isBusy.value = true;

    try {
      await entriesStore.moveEntry(entityId, categoryPath);
      const text = categoryPath
        ? t("toast.moved", { name: entry.name, path: categoryPath })
        : t("toast.movedOut", { name: entry.name });
      toasts.show(text);
    } catch (error) {
      showError(error);
    } finally {
      isBusy.value = false;
    }
  }

  function startRename(path: string): void {
    renamingPath.value = path;
  }

  function cancelRename(): void {
    renamingPath.value = null;
  }

  async function confirmRename(newPath: string): Promise<void> {
    const from = renamingPath.value;

    if (!from) return;

    isBusy.value = true;

    try {
      const renamedCount = await entriesStore.renameCategory(from, newPath);
      // Empty folders below it were renamed in the overlay too.
      await foldersStore.load();
      toasts.show(t("toast.renamed", { count: renamedCount }, renamedCount));
      renamingPath.value = null;
    } catch (error) {
      showError(error);
    } finally {
      isBusy.value = false;
    }
  }

  return { isBusy, renamingPath, moveEntry, startRename, cancelRename, confirmRename };
}
