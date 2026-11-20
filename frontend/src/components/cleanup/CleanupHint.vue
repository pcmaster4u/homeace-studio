<template>
  <div class="cleanup-hint">
    <span class="mdi mdi-auto-fix cleanup-hint__icon" />
    <div>
      <b>{{ t("cleanup.hintTitle") }}</b>
      {{ t("cleanup.hintText", { count: proposals.length, example }, proposals.length) }}
      <div class="cleanup-hint__buttons">
        <button class="btn btn--primary" type="button" @click="cleanup.open()">
          {{ t("cleanup.hintShow") }}
        </button>
        <button class="btn cleanup-hint__later" type="button" @click="cleanup.putOffHint()">
          {{ t("cleanup.hintLater") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useCleanupStore } from "@/stores/cleanupStore";

/** Hint above the folders while the tidy-up assistant has proposals. */
const { t } = useI18n();
const cleanup = useCleanupStore();
const { proposals } = storeToRefs(cleanup);

const example = computed(() => {
  const first = proposals.value[0];

  if (!first) return "";

  return first.kind === "split" ? first.from : first.names.join(t("cleanup.and"));
});
</script>

<style scoped>
.cleanup-hint {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 2px 2px 12px;
  padding: 10px 10px 10px 11px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.4;
}

.cleanup-hint b {
  display: block;
  margin-bottom: 1px;
  color: var(--fg);
  font-size: 13px;
}

.cleanup-hint__icon {
  margin-top: 1px;
  color: var(--accent);
  font-size: 18px;
}

.cleanup-hint__buttons {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.cleanup-hint__buttons .btn {
  height: 28px;
  padding: 0 10px;
  font-size: 12.5px;
}

.cleanup-hint__later {
  border-color: transparent;
  background: transparent;
}
</style>
