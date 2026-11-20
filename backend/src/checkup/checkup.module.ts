import { Module } from "@nestjs/common";

import { OverlayModule } from "../overlay/overlay.module";
import { SnapshotModule } from "../snapshot/snapshot.module";
import { CheckupController } from "./checkup.controller";
import { CheckupService } from "./checkup.service";

/** The check-up: references to missing or unavailable entities, unused helpers, idle automations. */
@Module({
  imports: [OverlayModule, SnapshotModule],
  controllers: [CheckupController],
  providers: [CheckupService],
})
export class CheckupModule {}
