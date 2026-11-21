import { Module } from "@nestjs/common";

import { DependenciesModule } from "../dependencies/dependencies.module";
import { SnapshotModule } from "../snapshot/snapshot.module";
import { EntryAreasController } from "./entry-areas.controller";
import { EntryAreasService } from "./entry-areas.service";

/** Area view: own and derived areas of every entry. */
@Module({
  imports: [SnapshotModule, DependenciesModule],
  controllers: [EntryAreasController],
  providers: [EntryAreasService],
})
export class EntryAreasModule {}
