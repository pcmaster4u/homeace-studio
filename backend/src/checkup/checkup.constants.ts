/** Reading every flow takes a moment; several requests in a row share one result. */
export const CHECKUP_CACHE_MS = 20_000;

/** Injection token for the clock, so tests control time. */
export const CHECKUP_CLOCK = Symbol("CHECKUP_CLOCK");
