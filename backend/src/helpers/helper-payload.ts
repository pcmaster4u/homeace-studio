import { HELPER_TYPE, type HelperType } from "./helpers.constants";

/** Settings as the UI sends them (camelCase); validated and mapped to HA's field names here. */
export type HelperSettings = Record<string, unknown>;

/** A setting is missing or invalid. `field` is the camelCase name the UI used. */
export class HelperSettingsError extends Error {
  constructor(readonly field: string) {
    super(`Invalid helper setting "${field}"`);
    this.name = HelperSettingsError.name;
  }
}

type HaPayload = Record<string, unknown>;

/** Duration of a timer as HH:MM:SS. */
const DURATION_PATTERN = /^\d{1,2}:[0-5]\d:[0-5]\d$/;
const INPUT_NUMBER_MODES = ["slider", "box"];
const INPUT_TEXT_MODES = ["text", "password"];
/** HA's own limit for input_text values. */
const INPUT_TEXT_MAX_LIMIT = 255;

const DEFAULTS = {
  numberStep: 1,
  textMin: 0,
  textMax: 100,
  counterInitial: 0,
  counterStep: 1,
  timerDuration: "00:00:00",
} as const;

/**
 * Builds the body for HA's `<type>/create` command from what the user entered.
 *
 * @param type - Which helper to create.
 * @param name - Display name; HA derives the entity ID from it.
 * @param icon - Optional "mdi:…" icon.
 * @param settings - Type-specific settings, e.g. `{ min: 0, max: 100 }` for input_number.
 * @returns The payload in HA's field names (snake_case).
 * @throws HelperSettingsError naming the first invalid setting.
 */
export function buildHelperPayload(
  type: HelperType,
  name: string,
  icon: string | undefined,
  settings: HelperSettings,
): HaPayload {
  const common: HaPayload = icon ? { name, icon } : { name };

  return { ...common, ...TYPE_PAYLOADS[type](settings) };
}

const TYPE_PAYLOADS: Record<HelperType, (settings: HelperSettings) => HaPayload> = {
  [HELPER_TYPE.inputBoolean]: () => ({}),
  [HELPER_TYPE.inputButton]: () => ({}),
  [HELPER_TYPE.inputNumber]: inputNumberPayload,
  [HELPER_TYPE.inputText]: inputTextPayload,
  [HELPER_TYPE.inputSelect]: inputSelectPayload,
  [HELPER_TYPE.inputDatetime]: inputDatetimePayload,
  [HELPER_TYPE.counter]: counterPayload,
  [HELPER_TYPE.timer]: timerPayload,
};

function inputNumberPayload(settings: HelperSettings): HaPayload {
  const min = readNumber(settings, "min");
  const max = readNumber(settings, "max");
  const step = readNumber(settings, "step", DEFAULTS.numberStep);
  const mode = readChoice(settings, "mode", INPUT_NUMBER_MODES, "slider");
  const unit = readOptionalString(settings, "unitOfMeasurement");

  if (max <= min) throw new HelperSettingsError("max");
  if (step <= 0) throw new HelperSettingsError("step");

  return { min, max, step, mode, ...(unit ? { unit_of_measurement: unit } : {}) };
}

function inputTextPayload(settings: HelperSettings): HaPayload {
  const min = readInteger(settings, "min", DEFAULTS.textMin);
  const max = readInteger(settings, "max", DEFAULTS.textMax);
  const mode = readChoice(settings, "mode", INPUT_TEXT_MODES, "text");
  const pattern = readOptionalString(settings, "pattern");

  if (min < 0) throw new HelperSettingsError("min");
  if (max < min || max > INPUT_TEXT_MAX_LIMIT) throw new HelperSettingsError("max");

  return { min, max, mode, ...(pattern ? { pattern } : {}) };
}

function inputSelectPayload(settings: HelperSettings): HaPayload {
  const raw = settings.options;

  if (!Array.isArray(raw)) throw new HelperSettingsError("options");

  const options = raw.map((option) => (typeof option === "string" ? option.trim() : ""));
  const hasBlank = options.some((option) => option === "");
  const hasDuplicates = new Set(options).size !== options.length;

  if (options.length === 0 || hasBlank || hasDuplicates) throw new HelperSettingsError("options");

  return { options };
}

function inputDatetimePayload(settings: HelperSettings): HaPayload {
  const hasDate = readBoolean(settings, "hasDate", true);
  const hasTime = readBoolean(settings, "hasTime", true);

  // HA needs at least one of the two.
  if (!hasDate && !hasTime) throw new HelperSettingsError("hasDate");

  return { has_date: hasDate, has_time: hasTime };
}

function counterPayload(settings: HelperSettings): HaPayload {
  const initial = readInteger(settings, "initial", DEFAULTS.counterInitial);
  const step = readInteger(settings, "step", DEFAULTS.counterStep);
  const minimum = readOptionalInteger(settings, "minimum");
  const maximum = readOptionalInteger(settings, "maximum");
  const restore = readBoolean(settings, "restore", true);

  if (step <= 0) throw new HelperSettingsError("step");
  if (minimum !== undefined && maximum !== undefined && maximum < minimum) {
    throw new HelperSettingsError("maximum");
  }

  return {
    initial,
    step,
    restore,
    ...(minimum !== undefined ? { minimum } : {}),
    ...(maximum !== undefined ? { maximum } : {}),
  };
}

function timerPayload(settings: HelperSettings): HaPayload {
  const duration = readOptionalString(settings, "duration") ?? DEFAULTS.timerDuration;
  const restore = readBoolean(settings, "restore", false);

  if (!DURATION_PATTERN.test(duration)) throw new HelperSettingsError("duration");

  return { duration, restore };
}

// ---- readers: each returns a valid value or throws for that field --------------------------

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function readNumber(settings: HelperSettings, field: string, fallback?: number): number {
  const value = settings[field];

  if (isMissing(value) && fallback !== undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new HelperSettingsError(field);

  return value;
}

function readInteger(settings: HelperSettings, field: string, fallback?: number): number {
  const value = readNumber(settings, field, fallback);

  if (!Number.isInteger(value)) throw new HelperSettingsError(field);

  return value;
}

function readOptionalInteger(settings: HelperSettings, field: string): number | undefined {
  return isMissing(settings[field]) ? undefined : readInteger(settings, field);
}

function readBoolean(settings: HelperSettings, field: string, fallback: boolean): boolean {
  const value = settings[field];

  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new HelperSettingsError(field);

  return value;
}

function readOptionalString(settings: HelperSettings, field: string): string | undefined {
  const value = settings[field];

  if (isMissing(value)) return undefined;
  if (typeof value !== "string") throw new HelperSettingsError(field);

  return value.trim() || undefined;
}

function readChoice(
  settings: HelperSettings,
  field: string,
  choices: readonly string[],
  fallback: string,
): string {
  const value = readOptionalString(settings, field) ?? fallback;

  if (!choices.includes(value)) throw new HelperSettingsError(field);

  return value;
}
