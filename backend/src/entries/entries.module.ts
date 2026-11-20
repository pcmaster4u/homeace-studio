import { Module } from "@nestjs/common";

import { CategoriesModule } from "../categories/categories.module";
import { HaModule } from "../ha/ha.module";
import { OverlayModule } from "../overlay/overlay.module";
import { ENTRY_REPOSITORY } from "./entries.constants";
import { EntriesController } from "./entries.controller";
import { EntriesService } from "./entries.service";
import { HaEntriesRepository } from "./repositories/ha-entries.repository";

@Module({
  imports: [HaModule, OverlayModule, CategoriesModule],
  controllers: [EntriesController],
  providers: [EntriesService, { provide: ENTRY_REPOSITORY, useClass: HaEntriesRepository }],
  exports: [EntriesService],
})
export class EntriesModule {}
