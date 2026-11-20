import type { HelperSettings, HelperType } from "@/constants/helpers";

import { apiFetch, apiPost } from "./api";

export type NewHelper = {
  type: HelperType;
  name: string;
  icon?: string;
  /** Folder to sort the helper into right away; null for none. */
  categoryPath: string | null;
  settings: HelperSettings;
};

/** @returns The entity ID of the new helper, e.g. "input_boolean.gaestemodus". */
export async function createHelper(helper: NewHelper): Promise<string> {
  const result = await apiPost<{ entityId: string }>("/helpers", helper);

  return result.entityId;
}

/** Deletes a helper in HA (storage helpers only). */
export async function deleteHelper(entityId: string): Promise<void> {
  await apiFetch<null>(`/helpers/${encodeURIComponent(entityId)}`, { method: "DELETE" });
}
