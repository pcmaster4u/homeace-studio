import { apiFetch, apiPost, apiSend } from "./api";

export type FolderOverview = {
  /** Empty folders the user created in the tree (kept by the backend, not in HA). */
  saved: string[];
  /** Folder path to color ("#rrggbb"). */
  colors: Record<string, string>;
  /** Parent path ("" for the top level) → its subfolders in the user's order. */
  order: Record<string, string[]>;
};

export function fetchFolders(): Promise<FolderOverview> {
  return apiFetch<FolderOverview>("/folders");
}

/** @returns The folder path as the backend stored it (levels trimmed). */
export async function createFolder(path: string): Promise<string> {
  const result = await apiPost<{ path: string }>("/folders", { path });

  return result.path;
}

export async function deleteFolder(path: string): Promise<void> {
  await apiFetch<null>(`/folders?path=${encodeURIComponent(path)}`, { method: "DELETE" });
}

/** The own order of a folder's subfolders; an empty list goes back to A–Z. */
export async function setFolderOrder(parent: string, order: string[]): Promise<void> {
  await apiSend<null>("PUT", "/folders/order", { parent, order });
}

/** @param color - "#rrggbb", or null for the default color. */
export async function setFolderColor(path: string, color: string | null): Promise<void> {
  await apiSend<null>("PUT", "/folders/color", { path, color });
}
