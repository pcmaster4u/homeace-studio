export const HELPER_REPOSITORY = Symbol("HELPER_REPOSITORY");
/** The wait function between entity lookups; shared with the flow editor. */
export { ENTITY_LOOKUP_WAIT } from "../common/utils/wait";

/** Helper types HomeAce Studio can create. Each is an HA storage collection with `<type>/create`. */
export const HELPER_TYPE = {
  inputBoolean: "input_boolean",
  inputButton: "input_button",
  inputNumber: "input_number",
  inputText: "input_text",
  inputSelect: "input_select",
  inputDatetime: "input_datetime",
  counter: "counter",
  timer: "timer",
} as const;

export type HelperType = (typeof HELPER_TYPE)[keyof typeof HELPER_TYPE];

export const HELPER_TYPES: readonly HelperType[] = Object.values(HELPER_TYPE);

export const HELPER_NAME_MAX_LENGTH = 100;
export const ICON_MAX_LENGTH = 100;

/**
 * HA adds the entity of a new helper a moment after `<type>/create` answers.
 * We look for it a few times before giving up.
 */
export const ENTITY_LOOKUP_ATTEMPTS = 10;
export const ENTITY_LOOKUP_DELAY_MS = 200;
