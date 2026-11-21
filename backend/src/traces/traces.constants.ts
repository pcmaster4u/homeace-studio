/** HA keeps this many runs per automation or script unless the config says otherwise. */
export const DEFAULT_STORED_TRACES = 5;

/** Upper bound for "keep more runs"; HA stores every kept run, so it stays small. */
export const MAX_STORED_TRACES = 50;
