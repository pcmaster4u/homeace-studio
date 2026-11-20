<template>
  <DialogFrame :title="title" @close="emit('cancel')" @submit="emit('confirm')">
    <p class="confirm-dialog__text">{{ text }}</p>
    <slot />

    <template #buttons>
      <button class="btn" type="button" :disabled="isBusy" @click="emit('cancel')">
        {{ t("common.cancel") }}
      </button>
      <button class="btn confirm-dialog__danger" type="submit" :disabled="isBusy">
        {{ confirmLabel }}
      </button>
    </template>
  </DialogFrame>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import DialogFrame from "./DialogFrame.vue";

defineProps<{
  title: string;
  text: string;
  confirmLabel: string;
  isBusy: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.confirm-dialog__text {
  margin: 0;
  color: var(--muted);
}

.confirm-dialog__danger {
  border-color: var(--err);
  background: var(--err);
  color: var(--on-accent);
}
</style>
