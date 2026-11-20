import type { EditorCatalog, EntityOption, Flow } from "@/types/editor";

import { apiFetch, apiSend } from "./api";

/** All trigger, condition and action types with names in this language. */
export function fetchCatalog(language: string): Promise<EditorCatalog> {
  return apiFetch<EditorCatalog>(`/editor/catalog?lang=${encodeURIComponent(language)}`);
}

/** The stored config of an automation or script, with names of its entities. */
export function fetchFlow(entityId: string): Promise<Flow> {
  return apiFetch<Flow>(`/editor/flows/${encodeURIComponent(entityId)}`);
}

/** Writes the whole config back to HA; returns the flow as saved. */
export function saveFlow(entityId: string, config: Record<string, unknown>): Promise<Flow> {
  return apiSend<Flow>("PUT", `/editor/flows/${encodeURIComponent(entityId)}`, { config });
}

/** Every entity HA has, for the entity picker. */
export function fetchEntities(): Promise<EntityOption[]> {
  return apiFetch<EntityOption[]>("/entities");
}
