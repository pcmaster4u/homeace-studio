import { Controller, Get } from "@nestjs/common";

import type { EntryAreas } from "./entry-areas";
import { EntryAreasService } from "./entry-areas.service";

/** Which areas each entry belongs to, for the area view (docs/api.md). */
@Controller("entry-areas")
export class EntryAreasController {
  constructor(private readonly entryAreas: EntryAreasService) {}

  @Get()
  findAll(): Promise<EntryAreas[]> {
    return this.entryAreas.findAll();
  }
}
