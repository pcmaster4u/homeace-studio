/** Reading every flow takes a moment; several requests in a row share one snapshot. */
export const SNAPSHOT_CACHE_MS = 20_000;

/** Injection token for the clock, so tests control time. */
export const SNAPSHOT_CLOCK = Symbol("SNAPSHOT_CLOCK");
