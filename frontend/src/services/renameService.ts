import { apiFetch, apiPost } from "./api";

/** A flow, scene or group that names an entity, and how often. */
export type EntityReference = {
  entityId: string;
  name: string;
  kind: string;
  count: number;
  /** In automations.yaml / scripts.yaml, so HomeAce Studio can rewrite it. */
  isEditable: boolean;
};

export type RenameResult = {
  entityId: string;
  updated: EntityReference[];
  skipped: EntityReference[];
};

const entryPath = (entityId: string): string => `/entries/${encodeURIComponent(entityId)}`;

export function fetchReferences(entityId: string): Promise<EntityReference[]> {
  return apiFetch<EntityReference[]>(`${entryPath(entityId)}/references`);
}

/** Changes the entity ID in HA, and in the flows that name it when `withReferences`. */
export function renameEntity(
  entityId: string,
  newEntityId: string,
  withReferences: boolean,
): Promise<RenameResult> {
  return apiPost<RenameResult>(`${entryPath(entityId)}/rename`, { newEntityId, withReferences });
}
