import type { EntryKind } from "@/types/entry";

import { apiFetch, apiPost } from "./api";

export type CheckupKind = "gone" | "unavailable" | "unused" | "stale";

export type CheckupRef = { entityId: string; name: string | null; since: string | null };

export type CheckupFinding = {
  key: string;
  kind: CheckupKind;
  entityId: string;
  name: string;
  entryKind: EntryKind;
  refs: CheckupRef[];
  lastTriggered: string | null;
  isOn: boolean;
};

export type CheckupOverview = {
  findings: CheckupFinding[];
  ignoredCount: number;
  checkedAt: string;
};

export const CHECKUP_KINDS: readonly CheckupKind[] = ["gone", "unavailable", "unused", "stale"];

export function fetchCheckup(): Promise<CheckupOverview> {
  return apiFetch<CheckupOverview>("/checkup");
}

export async function ignoreFinding(key: string): Promise<void> {
  await apiPost<null>("/checkup/ignore", { key });
}

export async function restoreFindings(): Promise<void> {
  await apiFetch<null>("/checkup/ignore", { method: "DELETE" });
}
