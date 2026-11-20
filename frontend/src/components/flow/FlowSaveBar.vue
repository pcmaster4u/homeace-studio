<template>
  <div class="flow-save-bar" role="status">
    <span class="flow-save-bar__dot" />
    <div class="flow-save-bar__text">
      <strong>{{ t("flow.unsaved") }}</strong>
      <small v-if="hasRemoteChange">{{ t("flow.remoteChanged") }}</small>
    </div>
    <button type="button" class="btn" :disabled="isSaving" @click="emit('discard')">
      {{ t("flow.discard") }}
    </button>
    <button type="button" class="btn btn--primary" :disabled="isSaving" @click="emit('save')">
      <span class="mdi mdi-cloud-upload-outline" />
      {{ isSaving ? t("flow.saving") : t("flow.save") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  isSaving: boolean;
  /** HA's version changed after the edits started; saving overwrites it. */
  hasRemoteChange: boolean;
}>();

const emit = defineEmits<{ save: []; discard: [] }>();

const { t } = useI18n();
</script>

<style scoped>
.flow-save-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 28px;
  border-bottom: 1px solid var(--line);
  background: var(--warn-soft);
}

.flow-save-bar__dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--warn);
}

.flow-save-bar__text {
  flex: 1;
  min-width: 160px;
  display: grid;
  color: var(--warn);
  font-size: 13px;
}

.flow-save-bar__text small {
  color: var(--fg);
  font-size: 12.5px;
}

@media (max-width: 820px) {
  .flow-save-bar {
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    padding-right: max(16px, env(safe-area-inset-right, 0px));
  }
}
</style>
