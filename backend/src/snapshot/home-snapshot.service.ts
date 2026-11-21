import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";

import { EDITOR_REPOSITORY } from "../editor/editor.constants";
import { FLOW_KIND, type FlowKind } from "../editor/editor.model";
import type { EditorRepository } from "../editor/repositories/editor.repository";
import type { Entry } from "../entries/entry.model";
import { EntriesService } from "../entries/entries.service";
import { HaConnectionService } from "../ha/ha-connection.service";
import { HA_COMMAND } from "../ha/ha.constants";
import type { HaArea, HaDevice, HaEntityRegistryEntry, HaState } from "../ha/ha.types";
import { LiveService } from "../live/live.service";
import { SNAPSHOT_CACHE_MS, SNAPSHOT_CLOCK } from "./snapshot.constants";

/** Everything the check-up, the dependencies and the area view read at once, taken at one moment. */
export type HomeSnapshot = {
  /** When it was read (ms since epoch). */
  at: number;
  entries: Entry[];
  states: HaState[];
  registry: HaEntityRegistryEntry[];
  devices: HaDevice[];
  areas: HaArea[];
  /** Config of every automation and script that could be read, by entity ID. */
  configs: ReadonlyMap<string, unknown>;
};

const FLOW_KINDS: readonly FlowKind[] = [FLOW_KIND.automation, FLOW_KIND.script];

/** Reads entries, states, registry and every flow config from HA, shared for a short while. */
@Injectable()
export class HomeSnapshotService implements OnModuleInit {
  private cached: HomeSnapshot | null = null;
  private running: Promise<HomeSnapshot> | null = null;

  constructor(
    private readonly entries: EntriesService,
    private readonly ha: HaConnectionService,
    @Inject(EDITOR_REPOSITORY) private readonly editor: EditorRepository,
    @Inject(SNAPSHOT_CLOCK) private readonly clock: () => number,
    private readonly live: LiveService,
  ) {}

  /** Anything that changes in HA makes the next request read again. */
  onModuleInit(): void {
    this.live.changes$.subscribe(() => this.invalidate());
  }

  invalidate(): void {
    this.cached = null;
  }

  /** The current snapshot; requests during a read share it. */
  get(): Promise<HomeSnapshot> {
    const now = this.clock();

    if (this.cached && now - this.cached.at < SNAPSHOT_CACHE_MS)
      return Promise.resolve(this.cached);

    this.running ??= this.read(now).finally(() => (this.running = null));
    return this.running;
  }

  private async read(now: number): Promise<HomeSnapshot> {
    const [entries, states, registry, devices, areas] = await Promise.all([
      this.entries.findAll(),
      this.editor.loadStates(),
      this.ha.call<HaEntityRegistryEntry[]>(HA_COMMAND.entityRegistryList),
      this.ha.call<HaDevice[]>(HA_COMMAND.deviceRegistryList),
      this.ha.call<HaArea[]>(HA_COMMAND.areaRegistryList),
    ]);
    const flows = entries.filter((entry) => (FLOW_KINDS as readonly string[]).includes(entry.kind));
    const configs = new Map<string, unknown>();

    await Promise.all(
      flows.map(async (entry) => {
        try {
          configs.set(
            entry.entityId,
            await this.editor.loadConfig(entry.kind as FlowKind, entry.entityId),
          );
        } catch {
          // A flow HA cannot hand out (e.g. broken YAML) is simply left out.
        }
      }),
    );

    this.cached = { at: now, entries, states, registry, devices, areas, configs };
    return this.cached;
  }
}
