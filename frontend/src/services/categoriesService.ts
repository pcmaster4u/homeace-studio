import { apiPost } from "./api";

/**
 * Renames a folder and everything below it, in all scopes.
 *
 * @returns How many HA categories were renamed.
 */
export async function renameCategory(from: string, to: string): Promise<number> {
  const result = await apiPost<{ renamedCount: number }>("/categories/rename", { from, to });

  return result.renamedCount;
}
