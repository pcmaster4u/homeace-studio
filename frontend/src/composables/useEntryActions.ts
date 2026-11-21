import { ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";

import type { EntryAction } from "@/constants/entries";
import { useEntriesStore } from "@/stores/entriesStore";
import { useFoldersStore } from "@/stores/foldersStore";
import { useMessagesStore } from "@/stores/messagesStore";
import { useToastStore } from "@/stores/toastStore";
import type { Entry, EntryChanges } from "@/types/entry";

type EntryActions = {
  isBusy: Ref<boolean>;
  /** The helper waiting for "really delete?"; null when no confirmation is open. */
  deletingEntry: Ref<Entry | null>;
  save: (entityId: string, changes: EntryChanges) => Promise<boolean>;
  act: (entry: Entry, action: EntryAction) => Promise<void>;
  toggleFavorite: (entry: Entry) => Promise<void>;
  saveNote: (entry: Entry, note: string) => Promise<void>;
  askDelete: (entry: Entry) => void;
  /** The entry in the "deaktivieren?" dialog; null when it is closed. */
  disablingEntry: Ref<Entry | null>;
  askDisable: (entry: Entry) => void;
  cancelDisable: () => void;
  confirmDisable: () => Promise<void>;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
  setFolderColor: (path: string, color: string | null) => Promise<void>;
};

/**
 * Editing an entry (name, icon, area, labels), actions (on, off, run), favorites, notes,
 * deleting helpers and folder colors, with toasts and catalog texts for errors.
 */
export function useEntryActions(): EntryActions {
  const { t } = useI18n();
  const entriesStore = useEntriesStore();
  const foldersStore = useFoldersStore();
  const messages = useMessagesStore();
  const toasts = useToastStore();

  const isBusy = ref(false);
  const deletingEntry = ref<Entry | null>(null);
  const disablingEntry = ref<Entry | null>(null);

  /** Runs one request; errors become an error toast. @returns Whether it worked. */
  async function run(action: () => Promise<void>, successText?: string): Promise<boolean> {
    isBusy.value = true;

    try {
      await action();
      if (successText) toasts.show(successText);
      return true;
    } catch (error) {
      toasts.show(messages.textFor(error, t("errors.actionFailed")), "error");
      return false;
    } finally {
      isBusy.value = false;
    }
  }

  async function confirmDisable(): Promise<void> {
    const entry = disablingEntry.value;

    if (!entry) return;

    const isDone = await run(
      () => entriesStore.updateEntry(entry.entityId, { isDisabled: true }),
      t("toast.disabled", { name: entry.name }),
    );

    if (isDone) disablingEntry.value = null;
  }

  async function confirmDelete(): Promise<void> {
    const entry = deletingEntry.value;

    if (!entry) return;

    const isDeleted = await run(
      () => entriesStore.deleteEntry(entry),
      t("toast.deleted", { name: entry.name }),
    );

    if (isDeleted) deletingEntry.value = null;
  }

  return {
    isBusy,
    deletingEntry,
    save: (entityId, changes) =>
      run(() => entriesStore.updateEntry(entityId, changes), t("toast.saved")),
    act: async (entry, action) => {
      await run(
        () => entriesStore.runAction(entry.entityId, action),
        t(`toast.action.${action}`, { name: entry.name }),
      );
    },
    toggleFavorite: async (entry) => {
      await run(() => entriesStore.updateExtras(entry.entityId, { isFavorite: !entry.isFavorite }));
    },
    saveNote: async (entry, note) => {
      // Saving on blur without a change would only cause a request and a toast.
      if (note.trim() === (entry.note ?? "")) return;

      await run(() => entriesStore.updateExtras(entry.entityId, { note }), t("toast.noteSaved"));
    },
    askDelete: (entry) => (deletingEntry.value = entry),
    disablingEntry,
    askDisable: (entry) => (disablingEntry.value = entry),
    cancelDisable: () => (disablingEntry.value = null),
    confirmDisable,
    cancelDelete: () => (deletingEntry.value = null),
    confirmDelete,
    setFolderColor: async (path, color) => {
      await run(() => foldersStore.setColor(path, color));
    },
  };
}
