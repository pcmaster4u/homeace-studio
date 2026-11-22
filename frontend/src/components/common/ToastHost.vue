<template>
  <div class="toast-host" aria-live="polite">
    <div
      v-for="toast in toastStore.toasts"
      :key="toast.id"
      class="toast-host__toast"
      :class="`toast-host__toast--${toast.tone}`"
      :role="toast.tone === 'error' ? 'alert' : 'status'"
    >
      <span
        class="mdi"
        :class="toast.tone === 'error' ? 'mdi-alert-circle-outline' : 'mdi-check-circle'"
      />
      <span>{{ toast.text }}</span>
      <button
        v-if="toast.undo"
        class="toast-host__undo"
        type="button"
        @click="
          () => {
            toastStore.dismiss(toast.id);
            toast.undo?.();
          }
        "
      >
        {{ t("toast.undo") }}
      </button>
      <button
        class="toast-host__close"
        type="button"
        :aria-label="t('toast.close')"
        @click="toastStore.dismiss(toast.id)"
      >
        <span class="mdi mdi-close" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useToastStore } from "@/stores/toastStore";

const { t } = useI18n();
const toastStore = useToastStore();
</script>

<style scoped>
.toast-host {
  position: fixed;
  left: 50%;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  z-index: 120;
  display: grid;
  justify-items: center;
  gap: 8px;
  width: max-content;
  max-width: calc(100vw - 32px);
  transform: translateX(-50%);
}

.toast-host__toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 10px 16px;
  border-radius: 10px;
  background: var(--fg);
  color: var(--bg);
  box-shadow: var(--shadow);
  font-size: 13.5px;
  animation: toast-in 0.22s ease-out;
}

.toast-host__toast--success .mdi:first-child {
  color: var(--ok);
}

.toast-host__toast--error .mdi:first-child {
  color: var(--err);
}

.toast-host__close {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
}

.toast-host__close:hover {
  opacity: 1;
}

@keyframes toast-in {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
}

.toast-host__undo {
  margin-left: 4px;
  padding: 2px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.toast-host__undo:hover {
  background: var(--accent-soft);
}
</style>
