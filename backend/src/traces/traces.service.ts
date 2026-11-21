import { Inject, Injectable } from "@nestjs/common";

import { EDITOR_REPOSITORY } from "../editor/editor.constants";
import { FLOW_KIND, type FlowKind } from "../editor/editor.model";
import type { EditorRepository } from "../editor/repositories/editor.repository";
import { HaConnectionService } from "../ha/ha-connection.service";
import { HA_COMMAND } from "../ha/ha.constants";
import { toRun, type HaTrace } from "./trace-mapper";
import { DEFAULT_STORED_TRACES } from "./traces.constants";
import type { Run, RunHistory } from "./traces.model";

const FLOW_KINDS: readonly string[] = [FLOW_KIND.automation, FLOW_KIND.script];

/** The runs HA kept of an automation or script (docs/api.md). */
@Injectable()
export class TracesService {
  constructor(
    private readonly ha: HaConnectionService,
    @Inject(EDITOR_REPOSITORY) private readonly editor: EditorRepository,
  ) {}

  async forEntity(entityId: string): Promise<RunHistory> {
    const kind = entityId.split(".")[0] ?? "";
    if (!FLOW_KINDS.includes(kind)) return { entityId, storedTraces: 0, runs: [] };

    const config = await this.editor.loadConfig(kind as FlowKind, entityId);
    const storedTraces = storedTracesOf(config);
    // HA files runs under the automation id or the script key; without one it keeps none.
    const itemId = await this.editor.loadStorageKey(kind as FlowKind, entityId, config);
    if (!itemId) return { entityId, storedTraces, runs: [] };

    const summaries = await this.ha.call<HaTrace[]>(HA_COMMAND.traceList, {
      domain: kind,
      item_id: itemId,
    });
    const runs = await Promise.all(summaries.map((summary) => this.loadRun(kind, itemId, summary)));

    return {
      entityId,
      storedTraces,
      runs: runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    };
  }

  /** The full run; when HA dropped it meanwhile, the summary has to do. */
  private async loadRun(domain: string, itemId: string, summary: HaTrace): Promise<Run> {
    try {
      const trace = await this.ha.call<HaTrace>(HA_COMMAND.traceGet, {
        domain,
        item_id: itemId,
        run_id: summary.run_id,
      });
      return toRun(trace);
    } catch {
      return toRun(summary);
    }
  }
}

function storedTracesOf(config: Record<string, unknown>): number {
  const trace = config.trace;
  const value =
    trace && typeof trace === "object"
      ? (trace as Record<string, unknown>).stored_traces
      : undefined;

  return typeof value === "number" && value > 0 ? value : DEFAULT_STORED_TRACES;
}
