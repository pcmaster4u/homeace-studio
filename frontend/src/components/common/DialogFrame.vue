<template>
  <div class="dialog-frame" role="presentation" @click.self="emit('close')">
    <form
      class="dialog-frame__panel"
      :class="{ 'dialog-frame__panel--wide': isWide }"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @submit.prevent="emit('submit')"
    >
      <h2>{{ title }}</h2>
      <slot />
      <div class="dialog-frame__buttons">
        <slot name="buttons" />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";

defineProps<{
  title: string;
  /** For dialogs with long lists, like the tidy-up assistant; the buttons then stay in view. */
  isWide?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

onKeyStroke("Escape", () => emit("close"));
</script>

<style scoped>
.dialog-frame {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: grid;
  place-items: center;
  padding: 20px max(16px, env(safe-area-inset-right, 0px)) 20px
    max(16px, env(safe-area-inset-left, 0px));
  background: var(--scrim);
}

.dialog-frame__panel {
  display: grid;
  gap: 12px;
  width: min(520px, 100%);
  max-height: 90vh;
  overflow: auto;
  padding: 22px;
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.dialog-frame__panel h2 {
  margin: 0;
  font: 700 20px/1.2 var(--font-display);
}

.dialog-frame__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.dialog-frame__panel--wide {
  width: min(780px, 100%);
}

.dialog-frame__panel--wide .dialog-frame__buttons {
  position: sticky;
  bottom: -22px;
  flex-wrap: wrap;
  align-items: center;
  margin: 4px -22px -22px;
  padding: 12px 22px 16px;
  border-top: 1px solid var(--line);
  background: var(--surface);
}
</style>
