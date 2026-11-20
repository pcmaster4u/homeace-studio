/** Own MIME type, so only our list rows count as droppable on the tree (not files or text). */
export const ENTRY_DRAG_TYPE = "application/x-homeace-entity";

/** The part of DataTransfer we use; keeps the helpers testable without a browser. */
type EntryTransfer = Pick<DataTransfer, "types" | "getData" | "setData">;

/** Puts an entity ID on a drag that starts at a list row. */
export function setDraggedEntity(transfer: EntryTransfer, entityId: string): void {
  transfer.setData(ENTRY_DRAG_TYPE, entityId);
}

/**
 * Whether a drag carries one of our entries. Works during dragover, where browsers only reveal
 * the types and not the data itself.
 */
export function carriesEntity(transfer: Pick<DataTransfer, "types"> | null): boolean {
  return transfer !== null && [...transfer.types].includes(ENTRY_DRAG_TYPE);
}

/** The dragged entity ID on drop, or null when the drag came from somewhere else. */
export function getDraggedEntity(transfer: EntryTransfer | null): string | null {
  if (!transfer || !carriesEntity(transfer)) return null;

  return transfer.getData(ENTRY_DRAG_TYPE) || null;
}
