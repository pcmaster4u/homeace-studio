import { createI18n } from "vue-i18n";

import de from "@/locales/de";
import en from "@/locales/en";

export const APP_LOCALES = ["de", "en"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "de";

/** German is the source of truth; every other language must have the same keys. */
export type MessageSchema = typeof de;

export const i18n = createI18n<[MessageSchema], AppLocale>({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: "en",
  messages: { de, en },
});
