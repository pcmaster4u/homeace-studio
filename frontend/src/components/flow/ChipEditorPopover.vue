<template>
  <Teleport to="body">
    <div
      ref="popover"
      class="chip-editor"
      :class="{ 'chip-editor--sheet': isNarrow }"
      :style="positionStyle"
      role="dialog"
      :aria-label="edit.title"
      @keydown.esc.stop="emit('close')"
    >
      <div class="chip-editor__title">{{ edit.title }}</div>

      <ChoiceList
        v-if="listOptions"
        :options="listOptions"
        :selected="selected"
        :is-multiple="isMultiple"
        :is-searchable="listOptions.length > SEARCH_FROM"
        @pick="pick"
      />

      <div v-else-if="editor.type === 'duration'" class="chip-editor__duration">
        <label v-for="part in DURATION_PARTS" :key="part">
          <input
            v-model.number="duration[part]"
            class="field-input"
            type="number"
            min="0"
            @keydown.enter="applyInput"
          />
          <span>{{ t(`flow.units.${part}`) }}</span>
        </label>
      </div>

      <template v-else-if="editor.type === 'template' || isMultiline">
        <textarea
          ref="firstInput"
          v-model="text"
          class="field-input chip-editor__area"
          :class="{ mono: editor.type === 'template' }"
          rows="4"
          spellcheck="false"
        />
        <p v-if="editor.type === 'template'" class="chip-editor__hint">
          {{ t("flow.edit.templateHint") }}
        </p>
      </template>

      <div v-else class="chip-editor__row">
        <input
          ref="firstInput"
          v-model="text"
          class="field-input"
          :type="inputType"
          :step="inputStep"
          :min="editor.type === 'number' ? editor.min : undefined"
          :max="editor.type === 'number' ? editor.max : undefined"
          autocomplete="off"
          @keydown.enter="applyInput"
        />
        <span v-if="editor.type === 'number' && editor.unit" class="chip-editor__unit">
          {{ editor.unit }}
        </span>
      </div>

      <template v-if="suggestions.length > 0">
        <div class="chip-editor__subtitle">{{ t("flow.edit.suggestions") }}</div>
        <div class="chip-editor__suggestions">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion.value"
            type="button"
            class="chip-editor__suggestion"
            :class="{ 'chip-editor__suggestion--on': suggestion.value === text }"
            @click="emit('apply', suggestion.value)"
          >
            {{ suggestion.label }}
          </button>
        </div>
      </template>

      <div v-if="canRemove || needsApply" class="chip-editor__buttons">
        <button v-if="canRemove" type="button" class="btn" @click="emit('apply', undefined)">
          {{ t("flow.edit.remove") }}
        </button>
        <button v-if="needsApply" type="button" class="btn btn--primary" @click="applyInput">
          {{ t("flow.edit.apply") }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onClickOutside, useEventListener, useMediaQuery } from "@vueuse/core";
import { computed, nextTick, onMounted, reactive, ref, toRef } from "vue";
import { useI18n } from "vue-i18n";

import { useLookupsStore } from "@/stores/lookupsStore";
import type { ChipEdit } from "@/types/editor";
import {
  listValue,
  numberValue,
  selectedValues,
  textValue,
  timeValue,
} from "@/utils/flow/editValue";
import { joinDuration, splitDuration } from "@/utils/flow/formatValue";
import { stateSuggestions } from "@/utils/flow/stateSuggestions";

import ChoiceList, { type ListOption } from "./ChoiceList.vue";

const props = defineProps<{
  edit: ChipEdit;
  /** The clicked chip; the popover opens next to it. */
  anchor: HTMLElement;
  isTechnicalDetailsVisible: boolean;
}>();

const emit = defineEmits<{
  /** The new value; undefined removes it. */
  apply: [value: unknown];
  close: [];
}>();

const { t, te } = useI18n();
const lookups = useLookupsStore();

/** Lists get a search field from this length on. */
const SEARCH_FROM = 8;
/** Distance to the chip and to the window edges, in px. */
const GAP = 6;
const EDGE = 12;
const DURATION_PARTS = ["hours", "minutes", "seconds"] as const;

const popover = ref<HTMLElement | null>(null);
const firstInput = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const position = ref<{ left: number; top: number } | null>(null);
/** On phones the editor is a sheet at the bottom instead of a popover. */
const isNarrow = useMediaQuery("(max-width: 560px)");

const editor = computed(() => props.edit.editor);
const isMultiline = computed(() => editor.value.type === "text" && editor.value.isMultiline);
const isMultiple = computed(() => {
  const current = editor.value;

  return (
    (current.type === "entity" || current.type === "area" || current.type === "choice") &&
    current.isMultiple
  );
});

const selected = ref<string[]>(selectedValues(props.edit.value));
const initialText =
  props.edit.value === undefined || typeof props.edit.value === "object"
    ? ""
    : String(props.edit.value);
const text = ref(initialText);
const duration = reactive(splitDuration(props.edit.value) ?? { hours: 0, minutes: 0, seconds: 0 });

const choiceLabel = (value: string): string =>
  te(`flow.choices.${value}`) ? t(`flow.choices.${value}`) : value;

/** Entities, areas and fixed choices are picked from a list; everything else is typed. */
const listOptions = computed((): ListOption[] | null => {
  const current = editor.value;

  if (current.type === "entity") {
    const domains = new Set(current.domains);
    const options = lookups.entities
      .filter((entity) => domains.size === 0 || domains.has(entity.domain))
      .map((entity) => ({
        value: entity.entityId,
        label: entity.name,
        sub: props.isTechnicalDetailsVisible ? entity.entityId : undefined,
      }));
    const missing = selected.value.filter((id) => !options.some((o) => o.value === id));

    return [...missing.map((id) => ({ value: id, label: id })), ...options];
  }

  if (current.type === "area") {
    return lookups.areas.map((area) => ({ value: area.areaId, label: area.name }));
  }

  if (current.type === "choice") return current.options;

  if (current.type === "boolean") {
    return [
      { value: "true", label: t("detail.yes") },
      { value: "false", label: t("detail.no") },
    ];
  }

  return null;
});

const suggestions = computed((): ListOption[] => {
  const current = editor.value;

  if (current.type !== "text" || !current.stateOf) return [];

  return stateSuggestions(current.stateOf, lookups.entities).map((state) => ({
    value: state,
    label: choiceLabel(state),
  }));
});

const inputType = computed(() => {
  const type = editor.value.type;

  if (type === "number") return "number";
  if (type === "time") return "time";
  if (type === "date") return "date";

  return "text";
});

const inputStep = computed(() => {
  const current = editor.value;

  if (current.type === "time") return 1;
  if (current.type === "number") return current.step ?? "any";

  return undefined;
});

const canRemove = computed(() => props.edit.isRemovable && props.edit.value !== undefined);
const needsApply = computed(() => listOptions.value === null || isMultiple.value);

const positionStyle = computed(() =>
  isNarrow.value || !position.value
    ? undefined
    : { left: `${position.value.left}px`, top: `${position.value.top}px` },
);

function pick(value: string): void {
  if (!isMultiple.value) {
    emit("apply", editor.value.type === "boolean" ? value === "true" : value);
    return;
  }

  selected.value = selected.value.includes(value)
    ? selected.value.filter((item) => item !== value)
    : [...selected.value, value];
}

function applyInput(): void {
  const value = inputValue();

  // A required field cannot be emptied; keep it as it is.
  if (value === undefined && !props.edit.isRemovable) {
    emit("close");
    return;
  }

  emit("apply", value);
}

function inputValue(): unknown {
  const current = editor.value;

  if (isMultiple.value) return listValue(selected.value, props.edit.value);
  if (current.type === "number") return numberValue(text.value);
  if (current.type === "time") return timeValue(text.value);
  if (current.type === "duration") {
    return joinDuration(duration.hours || 0, duration.minutes || 0, duration.seconds || 0);
  }

  return textValue(text.value);
}

/** Below the chip if there is room, otherwise above; always inside the window. */
function place(): void {
  const element = popover.value;

  if (!element) return;

  const chip = props.anchor.getBoundingClientRect();
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const left = Math.max(EDGE, Math.min(chip.left, window.innerWidth - width - EDGE));
  const below = chip.bottom + GAP;
  const top =
    below + height > window.innerHeight - EDGE ? Math.max(EDGE, chip.top - height - GAP) : below;

  position.value = { left, top };
}

// A click on the chip itself reopens the editor (FlowView handles it), so it is not "outside".
onClickOutside(popover, () => emit("close"), { ignore: [toRef(props, "anchor")] });
useEventListener(window, "resize", place);
// The detail pane scrolls; the popover follows its chip.
useEventListener(window, "scroll", place, { capture: true, passive: true });

onMounted(async () => {
  const current = editor.value;

  if (current.type === "entity" || (current.type === "text" && current.stateOf)) {
    void lookups.loadEntities();
  }

  await nextTick();
  place();
  // preventScroll: focusing must not shift the panes (their overflow is hidden, but still scrollable).
  firstInput.value?.focus({ preventScroll: true });
  if (firstInput.value instanceof HTMLInputElement) firstInput.value.select();
});
</script>

<style scoped>
.chip-editor {
  position: fixed;
  z-index: 100;
  display: grid;
  gap: 8px;
  width: 320px;
  max-width: calc(100vw - 24px);
  max-height: min(460px, 75vh);
  overflow: auto;
  padding: 10px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.chip-editor--sheet {
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  width: auto;
  max-width: none;
}

.chip-editor__title,
.chip-editor__subtitle {
  color: var(--faint);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.chip-editor__title {
  padding: 2px 2px 0;
}

.chip-editor__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chip-editor__unit {
  color: var(--muted);
  font-weight: 600;
}

.chip-editor__duration {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.chip-editor__duration label {
  display: grid;
  gap: 3px;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}

.chip-editor__area {
  height: auto;
  min-height: 90px;
  padding: 8px 10px;
  resize: vertical;
  line-height: 1.45;
}

.chip-editor__area.mono {
  font-size: 12.5px;
}

.chip-editor__hint {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.chip-editor__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.chip-editor__suggestion {
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  font-size: 12.5px;
  cursor: pointer;
}

.chip-editor__suggestion:hover {
  border-color: var(--line-strong);
  color: var(--fg);
}

.chip-editor__suggestion--on {
  border-color: var(--fg);
  background: var(--fg);
  color: var(--bg);
}

.chip-editor__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>
