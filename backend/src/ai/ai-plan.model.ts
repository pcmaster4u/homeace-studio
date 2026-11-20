/** What an AI may propose: rename a folder (with its subfolders), or move one entry into a folder. */
export const AI_OPERATION_TYPE = {
  renameFolder: "renameFolder",
  moveEntry: "moveEntry",
} as const;

export type AiPlanOperation =
  | { id: string; type: typeof AI_OPERATION_TYPE.renameFolder; from: string; to: string }
  | {
      id: string;
      type: typeof AI_OPERATION_TYPE.moveEntry;
      entityId: string;
      /** Name when the plan came in, to show it even if the entry is gone later. */
      entryName: string;
      to: string;
    };

export const AI_PLAN_STATUS = {
  open: "open",
  applied: "applied",
  partial: "partial",
  rejected: "rejected",
} as const;

export type AiPlanStatus = (typeof AI_PLAN_STATUS)[keyof typeof AI_PLAN_STATUS];

/** A folder plan from an AI, waiting for the user's review or already decided. Kept in the overlay. */
export type AiPlan = {
  id: string;
  title: string;
  /** The AI's explanation, shown above the plan. */
  reasoning: string;
  /** Client name from the MCP handshake, e.g. "claude-code"; null when unknown. */
  client: string | null;
  createdAt: string;
  status: AiPlanStatus;
  operations: AiPlanOperation[];
  appliedOperationIds: string[];
  decidedAt: string | null;
};

/** Whether an operation still fits the current state; the AI planned on what it read earlier. */
export const AI_OPERATION_STATE = {
  ok: "ok",
  /** The folder or entry does not exist anymore. */
  gone: "gone",
  /** Already true, e.g. the entry is in that folder. */
  done: "done",
  /** The target folder exists already (rename), or the entry cannot have a category. */
  conflict: "conflict",
} as const;

export type AiOperationState = (typeof AI_OPERATION_STATE)[keyof typeof AI_OPERATION_STATE];

/** Settings of the MCP access. The token is shown to the user, so it is kept as it is. */
export type McpAccess = {
  isEnabled: boolean;
  token: string | null;
};
