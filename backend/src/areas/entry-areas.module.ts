import { Module } from "@nestjs/common";

import { DependenciesModule } from "../dependencies/dependencies.module";
import { HaModule } from "../ha/ha.module";
import { SnapshotModule } from "../snapshot/snapshot.module";
import { AreasController } from "./areas.controller";
import { AreasService } from "./areas.service";
import { EntryAreasController } from "./entry-areas.controller";
import { EntryAreasService } from "./entry-areas.service";

/** Areas: create, change and delete them; own and derived areas of every entry for the area view. */
@Module({
  imports: [HaModule, SnapshotModule, DependenciesModule],
  controllers: [AreasController, EntryAreasController],
  providers: [AreasService, EntryAreasService],
})
export class EntryAreasModule {}
