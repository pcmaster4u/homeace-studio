<template>
  <div
    class="run-step"
    :class="[`run-step--${state.status}`, { 'run-step--nested': depth > 0 }]"
    :style="{ '--depth': depth }"
  >
    <span class="run-step__icon" :class="`run-step__icon--${tone}`">
      <span class="mdi" :class="STATUS_ICON[state.status]" />
    </span>
    <div class="run-step__main">
      <div class="run-step__kind">{{ t(`history.kind.${block.section}`) }}</div>
      <div class="run-step__text">{{ sentence }}</div>
      <div class="run-step__note">{{ note }}</div>
      <div v-if="state.error" class="run-step__error">{{ errorText(state.error) }}</div>
      <div v-if="state.error && isTechnicalDetailsVisible" class="run-step__tech mono">
        {{ state.error }}
      </div>
    </div>
  </div>
  <template v-for="branch in block.branches" :key="branch.label">
    <template v-for="child in branch.blocks" :key="child.id">
      <RunStepRow
        v-if="isShown(child)"
        :block="child"
        :states="states"
        :depth="depth + 1"
        :is-technical-details-visible="isTechnicalDetailsVisible"
        :error-text="errorText"
      />
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useStateText } from "@/composables/useStateText";
import { useSettingsStore } from "@/stores/settingsStore";
import type { DisplayBlock } from "@/types/editor";
import type { BlockRunState, BlockRunStatus } from "@/utils/runStates";
import { runDuration } from "@/utils/runTime";

/** One block of a flow with what it did in the selected run; nested blocks follow, indented. */
const props = defineProps<{
  block: DisplayBlock;
  states: ReadonlyMap<string, BlockRunState>;
  depth: number;
  isTechnicalDetailsVisible: boolean;
  /** HA's English error in plain words. */
  errorText: (error: string) => string;
}>();

const STATUS_ICON: Record<BlockRunStatus, string> = {
  fired: "mdi-check",
  notFired: "mdi-minus",
  passed: "mdi-check",
  failed: "mdi-cancel",
  done: "mdi-check",
  error: "mdi-close",
  running: "mdi-timer-sand",
  interrupted: "mdi-restart",
  notReached: "mdi-minus",
  notTaken: "mdi-minus",
  disabled: "mdi-minus",
};

const { t } = useI18n();
const settings = useSettingsStore();
const stateText = useStateText();

const NONE: BlockRunState = {
  status: "notReached",
  error: null,
  value: null,
  wanted: null,
  delaySeconds: null,
  choice: null,
};
const state = computed(() => props.states.get(props.block.id) ?? NONE);

const tone = computed(() => {
  const status = state.value.status;
  if (status === "fired" || status === "passed" || status === "done") return "ok";
  if (status === "failed") return "warn";
  if (status === "error") return "err";
  if (status === "running") return "run";
  return "none";
});

/** The block as the flow says it: title and chips. */
const sentence = computed(() =>
  [
    props.block.title,
    ...props.block.chips.map((chip) => (chip.label ? `${chip.label} ${chip.text}` : chip.text)),
  ].join(" "),
);

const note = computed(() => {
  const current = state.value;

  if (current.status === "done" && current.delaySeconds !== null) {
    return t("history.status.waited", {
      duration: runDuration(current.delaySeconds, settings.locale),
    });
  }
  if (current.status === "done" && current.choice !== null) {
    return typeof current.choice === "number"
      ? t("history.status.option", { number: current.choice + 1 })
      : t(current.choice === "then" ? "history.status.branchThen" : "history.status.branchElse");
  }
  if ((current.status === "passed" || current.status === "failed") && current.value !== null) {
    const value = stateText(current.value, null);
    const wanted = current.wanted === null ? null : stateText(current.wanted, null);

    if (current.status === "passed" && (wanted === null || wanted === value)) {
      return t("history.status.passedWas", { value });
    }
    return t(`history.status.${current.status}With`, { value, wanted: wanted ?? "" });
  }

  return t(`history.status.${current.status}`);
});

/** Branches that were not taken are left out; the rest shows. */
function isShown(child: DisplayBlock): boolean {
  return props.states.get(child.id)?.status !== "notTaken";
}
</script>

<style scoped>
.run-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0 10px calc(var(--depth) * 22px);
  border-top: 1px solid var(--line);
}

.run-step:first-child {
  border-top: 0;
}

.run-step--notReached .run-step__text,
.run-step--notFired .run-step__text,
.run-step--disabled .run-step__text {
  color: var(--faint);
}

.run-step__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 14px;
}

.run-step__icon--ok {
  background: var(--ok-soft);
  color: var(--ok);
}

.run-step__icon--warn {
  background: var(--warn-soft);
  color: var(--warn);
}

.run-step__icon--err {
  background: var(--err-soft, var(--warn-soft));
  color: var(--err, var(--warn));
}

.run-step__icon--run {
  background: var(--accent-soft);
  color: var(--accent);
}

.run-step__icon--none {
  background: var(--sunken);
  color: var(--faint);
}

.run-step__main {
  flex: 1;
  min-width: 0;
}

.run-step__kind {
  color: var(--faint);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.run-step__text {
  overflow-wrap: anywhere;
}

.run-step__note {
  color: var(--muted);
  font-size: 12.5px;
}

.run-step__error {
  margin-top: 2px;
  color: var(--err, var(--warn));
  font-size: 12.5px;
}

.run-step__tech {
  color: var(--faint);
  font-size: 11.5px;
}
</style>
