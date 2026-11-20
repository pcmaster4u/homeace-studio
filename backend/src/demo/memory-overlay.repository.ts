import { EMPTY_OVERLAY, type Overlay } from "../overlay/overlay.model";
import type { OverlayRepository } from "../overlay/repositories/overlay.repository";

/** Overlay of demo mode: kept in memory, so a demo never touches the real overlay file. */
export class MemoryOverlayRepository implements OverlayRepository {
  private overlay: Overlay;

  constructor(initial: Partial<Overlay>) {
    this.overlay = { ...structuredClone(EMPTY_OVERLAY), ...structuredClone(initial) };
  }

  read(): Promise<Overlay> {
    return Promise.resolve(structuredClone(this.overlay));
  }

  update(change: (overlay: Overlay) => Overlay): Promise<Overlay> {
    // Synchronous in memory, so changes cannot overlap.
    this.overlay = change(structuredClone(this.overlay));

    return this.read();
  }
}
