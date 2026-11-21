import { Controller, Get, Param } from "@nestjs/common";

import type { RunHistory } from "./traces.model";
import { TracesService } from "./traces.service";

/** Run history of automations and scripts (docs/api.md). */
@Controller("traces")
export class TracesController {
  constructor(private readonly traces: TracesService) {}

  @Get(":entityId")
  forEntity(@Param("entityId") entityId: string): Promise<RunHistory> {
    return this.traces.forEntity(entityId);
  }
}
