<template>
  <input
    ref="input"
    v-model="draft"
    class="inline-name"
    :aria-label="label"
    maxlength="100"
    @keydown.enter.prevent="finish(true)"
    @keydown.esc.prevent.stop="finish(false)"
    @keydown.stop
    @blur="finish(true)"
    @click.stop
    @dblclick.stop
    @pointerdown.stop
    @dragstart.prevent
  />
</template>

<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";

/**
 * Renames in place: Enter or leaving the field saves, Esc cancels. An unchanged or empty name
 * counts as cancel.
 */
const props = defineProps<{
  value: string;
  label: string;
}>();

const emit = defineEmits<{
  save: [name: string];
  cancel: [];
}>();

const draft = ref(props.value);
const input = useTemplateRef("input");
let isDone = false;

onMounted(() => {
  input.value?.focus();
  input.value?.select();
});

function finish(isSave: boolean): void {
  if (isDone) return;
  isDone = true;

  const name = draft.value.trim();
  if (isSave && name && name !== props.value) emit("save", name);
  else emit("cancel");
}
</script>

<style scoped>
.inline-name {
  width: 100%;
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--accent);
  border-radius: 7px;
  background: var(--surface);
  color: var(--fg);
  font: inherit;
  outline: 0;
  box-shadow: 0 0 0 3px var(--accent-soft);
}
</style>
