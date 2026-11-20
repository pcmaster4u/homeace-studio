import type { InjectionKey, Ref } from "vue";

import type { AddTarget, ChipEdit, DisplayBlock } from "@/types/editor";

/**
 * What FlowView hands down to every (nested) FlowBlock, so chips and menus can open their popover
 * without passing events up through each level of nesting.
 */
export type FlowEditing = {
  /** False for read-only flows: chips are plain text, menus and add buttons are hidden. */
  isEditable: Ref<boolean>;
  /** Opens the value editor next to the clicked chip. */
  openEditor: (edit: ChipEdit, anchor: HTMLElement) => void;
  /** Opens the list of optional fields that can be added to a block. */
  openAddMenu: (fields: ChipEdit[], anchor: HTMLElement) => void;
  /** Opens the ⋮ menu of a block: move, duplicate, disable, delete. */
  openBlockMenu: (block: DisplayBlock, anchor: HTMLElement) => void;
  /** Opens the list of block types to add to a list. */
  openTypePicker: (target: AddTarget, anchor: HTMLElement) => void;
};

export const FLOW_EDITING: InjectionKey<FlowEditing> = Symbol("flowEditing");
