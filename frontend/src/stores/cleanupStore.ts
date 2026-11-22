import { defineStore } from "pinia";
import { computed, ref } from "vue";

import {
  applyCleanup,
  fetchCleanup,
  ignoreProposal,
  previewCleanup,
  restoreProposals,
  type CleanupChange,
  type CleanupProposal,
  type CleanupStep,
} from "@/services/cleanupService";

/**
 * The tidy-up assistant: its proposals, whether the dialog is open, and whether the hint in the
 * tree was put off for this session.
 */
export const useCleanupStore = defineStore("cleanup", () => {
  const proposals = ref<CleanupProposal[]>([]);
  const ignoredCount = ref(0);
  const isOpen = ref(false);
  const isLoading = ref(false);
  /** "Later" in the tree: the hint stays away until the page is loaded again. */
  const isHintPutOff = ref(false);

  const isHintVisible = computed(() => proposals.value.length > 0);
  /** After "Später" the hint stays as a single line instead of the card. */
  const isHintCompact = computed(() => isHintPutOff.value);

  async function load(): Promise<void> {
    isLoading.value = true;

    try {
      const overview = await fetchCleanup();
      proposals.value = overview.proposals;
      ignoredCount.value = overview.ignoredCount;
    } catch (error) {
      // Without proposals the hint simply stays hidden.
      console.error("Loading clean-up proposals failed", error);
    } finally {
      isLoading.value = false;
    }
  }

  function open(): void {
    isOpen.value = true;
    void load();
  }

  function close(): void {
    isOpen.value = false;
  }

  function putOffHint(): void {
    isHintPutOff.value = true;
  }

  async function ignore(key: string): Promise<void> {
    await ignoreProposal(key);
    await load();
  }

  async function restore(): Promise<void> {
    await restoreProposals();
    await load();
  }

  function preview(changes: CleanupChange[]): Promise<CleanupStep[]> {
    return previewCleanup(changes);
  }

  /** Errors go to the caller, which shows them. @returns How many category names changed. */
  async function apply(changes: CleanupChange[]): Promise<number> {
    const categoryCount = await applyCleanup(changes);
    await load();

    return categoryCount;
  }

  return {
    proposals,
    ignoredCount,
    isOpen,
    isLoading,
    isHintVisible,
    isHintCompact,
    load,
    open,
    close,
    putOffHint,
    ignore,
    restore,
    preview,
    apply,
  };
});
