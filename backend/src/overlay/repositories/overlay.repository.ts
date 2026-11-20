import type { Overlay } from "../overlay.model";

export interface OverlayRepository {
  read(): Promise<Overlay>;

  /**
   * Reads, changes and writes the overlay as one step. Calls run one after another, so two
   * changes at the same time cannot overwrite each other.
   */
  update(change: (overlay: Overlay) => Overlay): Promise<Overlay>;
}
