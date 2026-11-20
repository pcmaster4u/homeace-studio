<template>
  <div
    class="pane-splitter"
    :class="{ 'pane-splitter--dragging': isDragging }"
    role="separator"
    aria-orientation="vertical"
    :aria-label="label"
    :aria-valuenow="width"
    :aria-valuemin="min"
    :aria-valuemax="max"
    tabindex="0"
    @pointerdown="startDrag"
    @dblclick="emit('reset')"
    @keydown="moveByKeyboard"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SPLITTER_KEYBOARD_STEP } from "@/constants/layout";

/** Width of the pane left of the splitter; the parent clamps it to its limits. */
const width = defineModel<number>({ required: true });

defineProps<{
  label: string;
  min: number;
  max: number;
}>();

const emit = defineEmits<{
  reset: [];
}>();

/** Set on <body> while dragging, so the cursor stays and text is not selected. */
const RESIZING_BODY_CLASS = "is-resizing";
const KEY_STEPS: Partial<Record<string, number>> = {
  ArrowLeft: -SPLITTER_KEYBOARD_STEP,
  ArrowRight: SPLITTER_KEYBOARD_STEP,
};

const isDragging = ref(false);

function startDrag(event: PointerEvent): void {
  const handle = event.currentTarget as HTMLElement;
  const startX = event.clientX;
  const startWidth = width.value;

  // Pointer capture keeps the move events coming even when the pointer leaves the thin handle.
  handle.setPointerCapture(event.pointerId);
  isDragging.value = true;
  document.body.classList.add(RESIZING_BODY_CLASS);

  const onMove = (move: PointerEvent): void => {
    width.value = startWidth + move.clientX - startX;
  };
  const onEnd = (): void => {
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onEnd);
    handle.removeEventListener("pointercancel", onEnd);
    isDragging.value = false;
    document.body.classList.remove(RESIZING_BODY_CLASS);
  };

  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onEnd);
  handle.addEventListener("pointercancel", onEnd);
}

function moveByKeyboard(event: KeyboardEvent): void {
  const step = KEY_STEPS[event.key];

  if (!step) return;

  event.preventDefault();
  width.value += step;
}
</script>

<style scoped>
/* Takes no space in the grid; the ::before strip is the grab area. */
.pane-splitter {
  position: relative;
  width: 0;
  z-index: 20;
  touch-action: none;
}

.pane-splitter::before {
  content: "";
  position: absolute;
  inset: 0 -5px;
  cursor: col-resize;
}

.pane-splitter::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -1px;
  width: 3px;
  background: transparent;
  transition: background 0.12s;
}

.pane-splitter:hover::after,
.pane-splitter:focus-visible::after,
.pane-splitter--dragging::after {
  background: var(--accent);
}

.pane-splitter:focus-visible {
  outline: 0;
}

@media (pointer: coarse) {
  .pane-splitter::before {
    inset: 0 -12px;
  }
}
</style>
