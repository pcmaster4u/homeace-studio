import { Controller, Sse, type MessageEvent } from "@nestjs/common";
import { interval, map, merge, type Observable } from "rxjs";

import { LiveService } from "./live.service";

/** Keeps proxies (HA ingress) from closing an idle event stream. */
export const HEARTBEAT_MS = 25_000;

export const LIVE_MESSAGE = {
  changed: "changed",
  ping: "ping",
} as const;

@Controller()
export class LiveController {
  /**
   * Numbers every message: the browser keeps only the latest text, and an identical text would not
   * count as a change (live updates then stopped after the first one).
   */
  private sequence = 0;

  constructor(private readonly live: LiveService) {}

  /**
   * Server-sent events: a default "message" event with `{ "type": "changed", "seq": n }` after relevant
   * changes in HA, and a "ping" event as heartbeat. The browser reconnects on its own.
   */
  @Sse("events")
  events(): Observable<MessageEvent> {
    const changes = this.live.changes$.pipe(
      map((): MessageEvent => ({ data: { type: LIVE_MESSAGE.changed, seq: ++this.sequence } })),
    );
    const heartbeat = interval(HEARTBEAT_MS).pipe(
      map((): MessageEvent => ({ type: LIVE_MESSAGE.ping, data: "" })),
    );

    return merge(changes, heartbeat);
  }
}
