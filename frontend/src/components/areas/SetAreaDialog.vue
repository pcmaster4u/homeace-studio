<template>
  <DialogFrame
    :title="t('areas.set.title', { count }, count)"
    @close="emit('cancel')"
    @submit="submit"
  >
    <label class="field-label" :for="selectId">{{ t("areas.set.area") }}</label>
    <select :id="selectId" v-model="areaId" class="field-input" :disabled="isBusy">
      <option :value="NONE">{{ t("areas.set.none") }}</option>
      <option v-for="area in areas" :key="area.areaId" :value="area.areaId">{{ area.name }}</option>
    </select>
    <p class="set-area__hint">{{ t("areas.set.hint") }}</p>
    <button class="btn set-area__new" type="button" :disabled="isBusy" @click="emit('newArea')">
      <span class="mdi mdi-map-marker-plus-outline" />{{ t("areas.newArea") }}
    </button>

    <template #buttons>
      <button class="btn" type="button" :disabled="isBusy" @click="emit('cancel')">
        {{ t("common.cancel") }}
      </button>
      <button class="btn btn--primary" type="submit" :disabled="isBusy">
        {{ t("areas.set.confirm") }}
      </button>
    </template>
  </DialogFrame>
</template>

<script setup lang="ts">
import { ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";

import DialogFrame from "@/components/common/DialogFrame.vue";
import type { Area } from "@/types/entry";

/** "Bereich setzen" for ticked entries: an own area for all of them, or none. */
const props = defineProps<{
  count: number;
  areas: readonly Area[];
  /** Preselected, e.g. a new area just created from here. */
  initialAreaId: string | null;
  isBusy: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [areaId: string | null];
  newArea: [];
}>();

/** The select's value for "no own area" (a select cannot hold null cleanly in every browser). */
const NONE = "";

const { t } = useI18n();
const selectId = useId();
const areaId = ref(props.initialAreaId ?? props.areas[0]?.areaId ?? NONE);

watch(
  () => props.initialAreaId,
  (next) => {
    if (next) areaId.value = next;
  },
);

function submit(): void {
  if (!props.isBusy) emit("confirm", areaId.value === NONE ? null : areaId.value);
}
</script>

<style scoped>
.set-area__hint {
  margin: 8px 0 12px;
  color: var(--muted);
  font-size: 12.5px;
}

.set-area__new {
  gap: 6px;
}
</style>
