import { ref, type Ref } from "vue";

import { carriesEntity, getDraggedEntity } from "@/utils/dragDrop";

type DropTarget = {
  /** True while one of our entries hovers over the target, for the highlight. */
  isDropOver: Ref<boolean>;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent) => void;
};

/**
 * Makes an element accept dragged list entries.
 *
 * @param onEntryDropped - Called with the entity ID when an entry is dropped here.
 */
export function useEntryDropTarget(onEntryDropped: (entityId: string) => void): DropTarget {
  const isDropOver = ref(false);

  function onDragOver(event: DragEvent): void {
    if (!carriesEntity(event.dataTransfer)) return;

    // preventDefault() is what tells the browser "dropping here is allowed".
    event.preventDefault();
    isDropOver.value = true;
  }

  function onDragLeave(): void {
    isDropOver.value = false;
  }

  function onDrop(event: DragEvent): void {
    isDropOver.value = false;
    const entityId = getDraggedEntity(event.dataTransfer);

    if (!entityId) return;

    event.preventDefault();
    onEntryDropped(entityId);
  }

  return { isDropOver, onDragOver, onDragLeave, onDrop };
}
