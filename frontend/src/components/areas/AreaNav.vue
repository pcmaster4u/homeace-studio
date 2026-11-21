<template>
  <div class="area-nav">
    <div class="area-nav__heading">{{ t("areas.heading") }}</div>

    <div v-if="looseCount > 0" class="area-nav__tidy">
      <span class="mdi mdi-auto-fix area-nav__tidy-icon" />
      <div>
        <b>{{ t("areas.tidy.title") }}</b>
        {{ t("areas.tidy.cardText") }}
        {{ t("areas.tidy.cardCount", { count: looseCount }, looseCount) }}
        <div class="area-nav__tidy-buttons">
          <button class="btn btn--primary" type="button" @click="emit('tidy')">
            {{ t("areas.tidy.open") }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="!hasLoaded" class="area-nav__note">{{ t("areas.loading") }}</p>
    <template v-else>
      <p v-if="areas.length === 0" class="area-nav__note">{{ t("areas.noAreas") }}</p>
      <ul class="area-nav__list">
        <li v-for="area in areas" :key="area.areaId">
          <button
            type="button"
            class="area-nav__node"
            :class="{ 'area-nav__node--active': selected === areaFilter(area.areaId) }"
            @click="emit('select', areaFilter(area.areaId))"
          >
            <span class="mdi mdi-map-marker-outline" />
            <span class="area-nav__name">{{ area.name }}</span>
            <span class="area-nav__count">{{ area.count }}</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            class="area-nav__node"
            :class="{ 'area-nav__node--active': selected === areaFilter(null) }"
            @click="emit('select', areaFilter(null))"
          >
            <span class="mdi mdi-map-marker-off-outline" />
            <span class="area-nav__name">{{ t("areas.none") }}</span>
            <span class="area-nav__count">{{ noAreaCount }}</span>
          </button>
        </li>
      </ul>
    </template>

    <p class="area-nav__hint">
      <span class="mdi mdi-information-outline" />
      <span>{{ t("areas.note") }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import type { AreaNavItem } from "@/composables/useStudioData";
import { areaFilter } from "@/utils/entryFilter";

/** The tree of the area view: every area with entries, "Ohne Bereich" and the tidy-up card. */
defineProps<{
  areas: AreaNavItem[];
  noAreaCount: number;
  /** Entries without a folder that have an area; the tidy-up card shows when there are any. */
  looseCount: number;
  selected: string;
  hasLoaded: boolean;
}>();

const emit = defineEmits<{
  select: [category: string];
  tidy: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.area-nav {
  display: grid;
  gap: 2px;
}

.area-nav__heading {
  margin: 16px 6px 6px;
  color: var(--faint);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.area-nav__tidy {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 2px 2px 12px;
  padding: 10px 10px 10px 11px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.4;
}

.area-nav__tidy b {
  display: block;
  margin-bottom: 1px;
  color: var(--fg);
  font-size: 13px;
}

.area-nav__tidy-icon {
  margin-top: 1px;
  color: var(--accent);
  font-size: 18px;
}

.area-nav__tidy-buttons {
  margin-top: 8px;
}

.area-nav__tidy-buttons .btn {
  height: 28px;
  padding: 0 10px;
  font-size: 12.5px;
}

.area-nav__list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.area-nav__node {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.area-nav__node .mdi {
  color: var(--faint);
  font-size: 17px;
}

.area-nav__node:hover {
  background: var(--sunken);
}

.area-nav__node--active {
  background: var(--surface);
  color: var(--fg);
  font-weight: 600;
  box-shadow: inset 0 0 0 1px var(--line-strong);
}

.area-nav__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.area-nav__count {
  color: var(--faint);
  font-size: 12px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

.area-nav__note {
  margin: 4px 8px;
  color: var(--muted);
  font-size: 12.5px;
}

.area-nav__hint {
  display: flex;
  gap: 6px;
  margin: 14px 6px 0;
  color: var(--faint);
  font-size: 12px;
  line-height: 1.45;
}
</style>
