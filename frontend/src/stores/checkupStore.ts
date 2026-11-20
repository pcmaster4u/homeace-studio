import { defineStore } from "pinia";
import { computed, ref } from "vue";

import {
  fetchCheckup,
  ignoreFinding,
  restoreFindings,
  type CheckupFinding,
} from "@/services/checkupService";

/** The check-up: findings from HA, loaded in the background and after changes. */
export const useCheckupStore = defineStore("checkup", () => {
  const findings = ref<CheckupFinding[]>([]);
  const ignoredCount = ref(0);
  const isLoading = ref(false);
  const hasLoaded = ref(false);
  let running: Promise<void> | null = null;

  /** Findings per entity, for the banner in the detail and red chips in the flow. */
  const byEntity = computed(() => {
    const map = new Map<string, CheckupFinding[]>();
    for (const finding of findings.value) {
      map.set(finding.entityId, [...(map.get(finding.entityId) ?? []), finding]);
    }
    return map;
  });

  /** One load at a time; calls during a load share it. */
  function load(): Promise<void> {
    running ??= (async () => {
      isLoading.value = true;
      try {
        const overview = await fetchCheckup();
        findings.value = overview.findings;
        ignoredCount.value = overview.ignoredCount;
        hasLoaded.value = true;
      } catch (error) {
        console.error("Loading the check-up failed", error);
      } finally {
        isLoading.value = false;
        running = null;
      }
    })();

    return running;
  }

  async function ignore(key: string): Promise<void> {
    await ignoreFinding(key);
    findings.value = findings.value.filter((finding) => finding.key !== key);
    ignoredCount.value++;
  }

  async function restore(): Promise<void> {
    await restoreFindings();
    await load();
  }

  function findingsFor(entityId: string | null | undefined): CheckupFinding[] {
    return entityId ? (byEntity.value.get(entityId) ?? []) : [];
  }

  return { findings, ignoredCount, isLoading, hasLoaded, load, ignore, restore, findingsFor };
});
