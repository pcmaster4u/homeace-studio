import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";

import { EDITOR_REPOSITORY } from "../editor/editor.constants";
import { FLOW_KIND, type FlowKind } from "../editor/editor.model";
import type { EditorRepository } from "../editor/repositories/editor.repository";
import { EntriesService } from "../entries/entries.service";
import { HaConnectionService } from "../ha/ha-connection.service";
import { HA_COMMAND } from "../ha/ha.constants";
import type { HaEntityRegistryEntry } from "../ha/ha.types";
import { LiveService } from "../live/live.service";
import { OVERLAY_REPOSITORY } from "../overlay/overlay.constants";
import type { OverlayRepository } from "../overlay/repositories/overlay.repository";
import { analyzeCheckup, type CheckupFinding } from "./checkup-analysis";
import { CHECKUP_CACHE_MS, CHECKUP_CLOCK } from "./checkup.constants";

export type CheckupOverview = {
  findings: CheckupFinding[];
  ignoredCount: number;
  checkedAt: string;
};

const FLOW_KINDS: readonly FlowKind[] = [FLOW_KIND.automation, FLOW_KIND.script];

/** The check-up: what in the home needs a look, read live from HA. */
@Injectable()
export class CheckupService implements OnModuleInit {
  private cached: { at: number; findings: CheckupFinding[] } | null = null;

  constructor(
    private readonly entries: EntriesService,
    private readonly ha: HaConnectionService,
    @Inject(EDITOR_REPOSITORY) private readonly editor: EditorRepository,
    @Inject(OVERLAY_REPOSITORY) private readonly overlay: OverlayRepository,
    @Inject(CHECKUP_CLOCK) private readonly clock: () => number,
    private readonly live: LiveService,
  ) {}

  /** Anything that changes in HA may change the findings. */
  onModuleInit(): void {
    this.live.changes$.subscribe(() => this.invalidate());
  }

  async overview(): Promise<CheckupOverview> {
    const overlay = await this.overlay.read();
    const ignored = new Set(overlay.checkupIgnored);
    const all = await this.allFindings();

    return {
      findings: all.filter((finding) => !ignored.has(finding.key)),
      ignoredCount: ignored.size,
      checkedAt: new Date(this.cached?.at ?? this.clock()).toISOString(),
    };
  }

  async ignore(key: string): Promise<void> {
    await this.overlay.update((overlay) => ({
      ...overlay,
      checkupIgnored: [...new Set([...overlay.checkupIgnored, key])],
    }));
  }

  async restoreIgnored(): Promise<void> {
    await this.overlay.update((overlay) => ({ ...overlay, checkupIgnored: [] }));
  }

  /** After a change in HA the next request reads everything again. */
  invalidate(): void {
    this.cached = null;
  }

  private async allFindings(): Promise<CheckupFinding[]> {
    const now = this.clock();

    if (this.cached && now - this.cached.at < CHECKUP_CACHE_MS) return this.cached.findings;

    const [entries, states, registry] = await Promise.all([
      this.entries.findAll(),
      this.editor.loadStates(),
      this.ha.call<HaEntityRegistryEntry[]>(HA_COMMAND.entityRegistryList),
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
          // A flow HA cannot hand out (e.g. broken YAML) is simply not checked.
        }
      }),
    );

    const findings = analyzeCheckup({
      entries,
      states,
      registryIds: new Set(registry.map((entry) => entry.entity_id)),
      configs,
      now: new Date(now),
      ignored: new Set(),
    });

    this.cached = { at: now, findings };
    return findings;
  }
}
