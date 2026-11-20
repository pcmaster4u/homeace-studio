<template>
  <DialogFrame :title="t('helper.title')" @close="emit('cancel')" @submit="submit">
    <div class="new-helper__types" role="radiogroup" :aria-label="t('helper.type')">
      <button
        v-for="option in HELPER_TYPES"
        :key="option"
        type="button"
        role="radio"
        class="new-helper__type"
        :class="{ 'new-helper__type--active': type === option }"
        :aria-checked="type === option"
        @click="selectType(option)"
      >
        <span class="mdi" :class="HELPER_TYPE_ICON[option]" />
        <span>{{ t(`helper.types.${option}`) }}</span>
      </button>
    </div>
    <p class="new-helper__later">{{ t("helper.later") }}</p>

    <label class="field-label" :for="nameId">{{ t("helper.name") }}</label>
    <input
      :id="nameId"
      ref="nameInput"
      v-model="name"
      class="field-input"
      autocomplete="off"
      :disabled="isBusy"
    />

    <div class="new-helper__row">
      <label class="new-helper__field">
        <span class="field-label">{{ t("helper.folder") }}</span>
        <input
          v-model="folder"
          class="field-input"
          :list="foldersListId"
          :placeholder="t('detail.categoryPlaceholder')"
          autocomplete="off"
        />
        <datalist :id="foldersListId">
          <option v-for="path in allPaths" :key="path" :value="path" />
        </datalist>
      </label>
      <label class="new-helper__field">
        <span class="field-label">{{ t("helper.icon") }}</span>
        <input v-model="icon" class="field-input" placeholder="mdi:lightbulb" autocomplete="off" />
      </label>
    </div>

    <HelperSettingsFields v-model="settings" :type="type" />

    <template #buttons>
      <button class="btn" type="button" :disabled="isBusy" @click="emit('cancel')">
        {{ t("common.cancel") }}
      </button>
      <button class="btn btn--primary" type="submit" :disabled="isBusy || !name.trim()">
        {{ t("common.create") }}
      </button>
    </template>
  </DialogFrame>
</template>

<script setup lang="ts">
import { onMounted, ref, useId, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

import DialogFrame from "@/components/common/DialogFrame.vue";
import {
  DEFAULT_HELPER_SETTINGS,
  HELPER_TYPE_ICON,
  HELPER_TYPES,
  type HelperSettings,
  type HelperType,
} from "@/constants/helpers";
import type { NewHelper } from "@/services/helpersService";

import HelperSettingsFields from "./HelperSettingsFields.vue";

const props = defineProps<{
  /** Folder to suggest, usually the one selected in the tree. */
  initialFolder: string | null;
  /** Existing folder paths, offered as suggestions. */
  allPaths: string[];
  isBusy: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [helper: NewHelper];
}>();

const { t } = useI18n();
const nameId = useId();
const foldersListId = useId();
const nameInput = useTemplateRef("nameInput");

const type = ref<HelperType>("input_boolean");
const name = ref("");
const icon = ref("");
const folder = ref(props.initialFolder ?? "");
const settings = ref<HelperSettings>(structuredClone(DEFAULT_HELPER_SETTINGS.input_boolean));

/** Each type starts from its own defaults; switching type discards the other type's values. */
function selectType(next: HelperType): void {
  type.value = next;
  settings.value = structuredClone(DEFAULT_HELPER_SETTINGS[next]);
}

function submit(): void {
  const trimmedName = name.value.trim();

  if (!trimmedName) return;

  emit("confirm", {
    type: type.value,
    name: trimmedName,
    icon: icon.value.trim() || undefined,
    categoryPath: folder.value.trim() || null,
    settings: settings.value,
  });
}

onMounted(() => nameInput.value?.focus());
</script>

<style scoped>
.new-helper__types {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.new-helper__type {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.new-helper__type .mdi {
  color: var(--kind-helper);
  font-size: 22px;
}

.new-helper__type:hover {
  border-color: var(--line-strong);
}

.new-helper__type--active {
  border-color: var(--kind-helper);
  background: var(--kind-helper-soft);
  color: var(--fg);
}

.new-helper__later {
  margin: 0;
  color: var(--faint);
  font-size: 12px;
}

.new-helper__row {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 12px;
}

.new-helper__field {
  display: grid;
  gap: 5px;
}

@media (max-width: 520px) {
  .new-helper__types {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .new-helper__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
