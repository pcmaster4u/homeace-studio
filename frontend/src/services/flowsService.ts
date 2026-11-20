import type { FlowKind } from "@/types/editor";

import { apiFetch, apiPost } from "./api";

export type NewFlow = {
  kind: FlowKind;
  name: string;
  /** Folder to sort the new flow into right away; null for none. */
  categoryPath: string | null;
};

/** Creates an empty automation or script in HA. @returns Its entity ID. */
export async function createFlow(flow: NewFlow): Promise<string> {
  const result = await apiPost<{ entityId: string }>("/flows", flow);

  return result.entityId;
}

/** Deletes an automation or script from automations.yaml / scripts.yaml. */
export async function deleteFlow(entityId: string): Promise<void> {
  await apiFetch<null>(`/flows/${encodeURIComponent(entityId)}`, { method: "DELETE" });
}
