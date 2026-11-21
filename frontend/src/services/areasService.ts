import type { Area } from "@/types/entry";

import { apiFetch, apiPost, apiSend } from "./api";

/** @param icon - "mdi:sofa", or null for none. */
export function createArea(name: string, icon: string | null): Promise<Area> {
  return apiPost<Area>("/areas", { name, icon });
}

export function updateArea(
  areaId: string,
  changes: { name?: string; icon?: string | null },
): Promise<Area> {
  return apiSend<Area>("PATCH", `/areas/${encodeURIComponent(areaId)}`, changes);
}

/** Devices and entries in the area keep existing, without an area. */
export async function deleteArea(areaId: string): Promise<void> {
  await apiFetch<null>(`/areas/${encodeURIComponent(areaId)}`, { method: "DELETE" });
}
