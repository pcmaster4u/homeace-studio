/**
 * Resolves after the given time.
 *
 * @param milliseconds - How long to wait; 0 waits for the next timer tick.
 */
export function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Injection token for {@link wait}; tests replace it, so they do not really wait. */
export const ENTITY_LOOKUP_WAIT = Symbol("ENTITY_LOOKUP_WAIT");
