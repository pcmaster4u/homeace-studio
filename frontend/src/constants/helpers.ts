/** Helper types the backend can create (backend/src/helpers/helpers.constants.ts). */
export const HELPER_TYPES = [
  "input_boolean",
  "input_button",
  "input_number",
  "input_text",
  "input_select",
  "input_datetime",
  "counter",
  "timer",
] as const;

export type HelperType = (typeof HELPER_TYPES)[number];

export const HELPER_TYPE_ICON: Record<HelperType, string> = {
  input_boolean: "mdi-toggle-switch-outline",
  input_button: "mdi-gesture-tap-button",
  input_number: "mdi-ray-vertex",
  input_text: "mdi-form-textbox",
  input_select: "mdi-format-list-bulleted",
  input_datetime: "mdi-calendar-clock",
  counter: "mdi-counter",
  timer: "mdi-timer-outline",
};

export type HelperSettings = Record<string, string | number | boolean | string[]>;

/** Starting values of the settings form per type; the backend applies the same defaults. */
export const DEFAULT_HELPER_SETTINGS: Record<HelperType, HelperSettings> = {
  input_boolean: {},
  input_button: {},
  input_number: { min: 0, max: 100, step: 1, mode: "slider", unitOfMeasurement: "" },
  input_text: { min: 0, max: 100, mode: "text", pattern: "" },
  input_select: { options: ["", ""] },
  input_datetime: { hasDate: true, hasTime: true },
  counter: { initial: 0, step: 1, minimum: "", maximum: "", restore: true },
  timer: { duration: "00:05:00", restore: false },
};
