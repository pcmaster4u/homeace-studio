/** How a run ended, from HA's `script_execution` (and `state` while it runs). */
export const RUN_RESULT = {
  finished: "finished",
  /** A condition was not met; the actions did not run. */
  conditionsFailed: "conditionsFailed",
  error: "error",
  running: "running",
  /** Stopped from outside, e.g. restarted by a new trigger (mode "restart") or switched off. */
  cancelled: "cancelled",
  /** Not started because it was already running (mode "single", or too many runs). */
  ignored: "ignored",
  /** Ended by a "stop" action. */
  stopped: "stopped",
  unknown: "unknown",
} as const;

export type RunResult = (typeof RUN_RESULT)[keyof typeof RUN_RESULT];

/** One recorded step. `path` is HA's, e.g. "action/1/then/0"; `result` is HA's, untouched. */
export type RunStep = {
  path: string;
  at: string;
  result: Record<string, unknown> | null;
  error: string | null;
};

/** What started a run: for automations the trigger, for scripts who called it. */
export type RunStart = {
  /** Index of the trigger that fired; null for scripts and manual runs. */
  triggerIndex: number | null;
  entityId: string | null;
  from: string | null;
  to: string | null;
  /** HA's own English text, e.g. "state of binary_sensor.terrace_motion". */
  description: string | null;
  /** "user": someone pressed run; "flow": an automation or script started it. */
  by: "trigger" | "user" | "flow" | "unknown";
};

export type Run = {
  runId: string;
  startedAt: string;
  /** null while running. */
  finishedAt: string | null;
  result: RunResult;
  /** HA path of the last step reached. */
  lastStep: string | null;
  error: string | null;
  start: RunStart;
  /** In the order they happened. */
  steps: RunStep[];
};

export type RunHistory = {
  entityId: string;
  /** How many runs HA keeps (config `trace.stored_traces`, default 5). */
  storedTraces: number;
  /** Newest first. */
  runs: Run[];
};
