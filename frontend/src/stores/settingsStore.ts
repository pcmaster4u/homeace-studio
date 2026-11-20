import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";

import { DEFAULT_PANE_WIDTHS, PANE_WIDTH_LIMITS, type Pane } from "@/constants/layout";
import { DEFAULT_LOCALE, type AppLocale } from "@/i18n";
import { clampNumber } from "@/utils/number";

const STORAGE_KEY = {
  technicalDetails: "homeace.technicalDetails",
  paneWidths: "homeace.paneWidths",
  locale: "homeace.locale",
} as const;

/**
 * Per-viewer UI settings. Kept in the browser for now; later stored per HA user in the overlay.
 */
export const useSettingsStore = defineStore("settings", () => {
  /** Off by default: entity IDs, storage badges and API names would put beginners off. */
  const isTechnicalDetailsVisible = useLocalStorage(STORAGE_KEY.technicalDetails, false);
  const paneWidths = useLocalStorage(
    STORAGE_KEY.paneWidths,
    { ...DEFAULT_PANE_WIDTHS },
    { mergeDefaults: true },
  );
  const locale = useLocalStorage<AppLocale>(STORAGE_KEY.locale, DEFAULT_LOCALE);

  function setPaneWidth(pane: Pane, width: number): void {
    const limits = PANE_WIDTH_LIMITS[pane];
    paneWidths.value = { ...paneWidths.value, [pane]: clampNumber(width, limits.min, limits.max) };
  }

  function resetPaneWidth(pane: Pane): void {
    setPaneWidth(pane, DEFAULT_PANE_WIDTHS[pane]);
  }

  function resetPaneWidths(): void {
    paneWidths.value = { ...DEFAULT_PANE_WIDTHS };
  }

  return {
    isTechnicalDetailsVisible,
    paneWidths,
    locale,
    setPaneWidth,
    resetPaneWidth,
    resetPaneWidths,
  };
});
