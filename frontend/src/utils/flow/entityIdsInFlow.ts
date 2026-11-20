import type { DisplayBlock, DisplayFlow } from "@/types/editor";

/** Entity IDs the flow's entity chips name, in order, without repeats. */
export function entityIdsInFlow(flow: DisplayFlow): string[] {
  const ids = new Set<string>();
  const visit = (blocks: DisplayBlock[]): void => {
    for (const block of blocks) {
      for (const chip of block.chips) {
        if (chip.kind !== "entity" || chip.edit?.editor.type !== "entity") continue;

        const value = chip.edit.value;
        for (const item of Array.isArray(value) ? value : [value]) {
          if (typeof item === "string") ids.add(item);
        }
      }

      for (const branch of block.branches) visit(branch.blocks);
    }
  };

  visit(flow.triggers);
  visit(flow.conditions);
  visit(flow.actions);

  return [...ids];
}
