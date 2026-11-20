import { Module } from "@nestjs/common";

import { SnapshotModule } from "../snapshot/snapshot.module";
import { DependenciesController } from "./dependencies.controller";
import { DependenciesService } from "./dependencies.service";

/** Dependencies: what an automation, script, scene or helper uses, and who uses it. */
@Module({
  imports: [SnapshotModule],
  controllers: [DependenciesController],
  providers: [DependenciesService],
})
export class DependenciesModule {}
