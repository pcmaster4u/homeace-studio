<template>
  <form class="entry-edit" @submit.prevent="save">
    <div class="entry-edit__grid">
      <label class="entry-edit__field">
        <span class="field-label">{{ t("detail.name") }}</span>
        <input v-model="name" class="field-input" autocomplete="off" :disabled="isBusy" />
      </label>
      <label class="entry-edit__field">
        <span class="field-label">{{ t("detail.icon") }}</span>
        <span class="entry-edit__icon-row">
          <span class="mdi entry-edit__icon-preview" :class="mdiIconClass(icon) ?? fallbackIcon" />
          <input
            v-model="icon"
            class="field-input"
            placeholder="mdi:lightbulb"
            autocomplete="off"
            :disabled="isBusy"
          />
        </span>
      </label>
      <label class="entry-edit__field">
        <span class="field-label">{{ t("detail.area") }}</span>
        <select v-model="areaId" class="field-input" :disabled="isBusy">
          <option :value="null">{{ t("detail.noArea") }}</option>
          <option v-for="area in areas" :key="area.areaId" :value="area.areaId">
            {{ area.name }}
          </option>
        </select>
      </label>
    </div>

    <div class="entry-edit__field">
      <span class="field-label">{{ t("detail.labels") }}</span>
      <div class="entry-edit__labels">
        <button
          v-for="label in labels"
          :key="label.labelId"
          class="entry-edit__label"
          :class="{ 'entry-edit__label--on': labelIds.includes(label.labelId) }"
          type="button"
          :aria-pressed="labelIds.includes(label.labelId)"
          :disabled="isBusy"
          @click="toggleLabel(label.labelId)"
        >
          {{ label.name }}
        </button>
        <span v-if="labels.length === 0" class="entry-edit__hint">{{ t("detail.noLabels") }}</span>
      </div>
    </div>

    <div class="entry-edit__buttons">
      <span class="entry-edit__hint">{{ t("detail.nameHint") }}</span>
      <button class="btn" type="button" :disabled="isBusy || !isDirty" @click="reset">
        {{ t("common.reset") }}
      </button>
      <button class="btn btn--primary" type="submit" :disabled="isBusy || !isDirty">
        {{ t("common.save") }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import type { Area, Entry, EntryChanges, Label } from "@/types/entry";
import { mdiIconClass } from "@/utils/text";

const props = defineProps<{
  entry: Entry;
  areas: Area[];
  labels: Label[];
  /** Shown in the preview while the icon field is empty or not an mdi icon. */
  fallbackIcon: string;
  isBusy: boolean;
}>();

const emit = defineEmits<{
  save: [changes: EntryChanges];
}>();

const { t } = useI18n();

const name = ref("");
const icon = ref("");
const areaId = ref<string | null>(null);
const labelIds = ref<string[]>([]);

/** Fills the form from the entry; runs when another entry opens or after saving. */
function reset(): void {
  name.value = props.entry.name;
  icon.value = props.entry.icon ?? "";
  areaId.value = props.entry.area?.areaId ?? null;
  labelIds.value = props.entry.labels.map((label) => label.labelId);
}

watch(() => props.entry, reset, { immediate: true });

const originalLabelIds = computed(() => props.entry.labels.map((label) => label.labelId));
const hasLabelChanges = computed(() => {
  const original = [...originalLabelIds.value].sort().join();
  const current = [...labelIds.value].sort().join();

  return original !== current;
});
const isDirty = computed(
  () =>
    name.value.trim() !== props.entry.name ||
    icon.value.trim() !== (props.entry.icon ?? "") ||
    areaId.value !== (props.entry.area?.areaId ?? null) ||
    hasLabelChanges.value,
);

function toggleLabel(labelId: string): void {
  labelIds.value = labelIds.value.includes(labelId)
    ? labelIds.value.filter((id) => id !== labelId)
    : [...labelIds.value, labelId];
}

/** Sends only what changed, so a save never overwrites something else by accident. */
function save(): void {
  const changes: EntryChanges = {};

  if (name.value.trim() !== props.entry.name) changes.name = name.value;
  if (icon.value.trim() !== (props.entry.icon ?? "")) changes.icon = icon.value;
  if (areaId.value !== (props.entry.area?.areaId ?? null)) changes.areaId = areaId.value;
  if (hasLabelChanges.value) changes.labelIds = labelIds.value;

  emit("save", changes);
}
</script>

<style scoped>
.entry-edit {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
}

.entry-edit__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.entry-edit__field {
  display: grid;
  gap: 5px;
}

.entry-edit__icon-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.entry-edit__icon-preview {
  color: var(--muted);
  font-size: 22px;
}

.entry-edit__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.entry-edit__label {
  padding: 4px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
}

.entry-edit__label--on {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--fg);
}

.entry-edit__buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.entry-edit__buttons .entry-edit__hint {
  flex: 1;
}

.entry-edit__hint {
  color: var(--faint);
  font-size: 12.5px;
}

@media (max-width: 1000px) {
  .entry-edit__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
