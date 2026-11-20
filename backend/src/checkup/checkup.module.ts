import { Module } from "@nestjs/common";

import { EditorModule } from "../editor/editor.module";
import { EntriesModule } from "../entries/entries.module";
import { HaModule } from "../ha/ha.module";
import { LiveModule } from "../live/live.module";
import { OverlayModule } from "../overlay/overlay.module";
import { CHECKUP_CLOCK } from "./checkup.constants";
import { CheckupController } from "./checkup.controller";
import { CheckupService } from "./checkup.service";

/** The check-up: references to missing or unavailable entities, unused helpers, idle automations. */
@Module({
  imports: [HaModule, OverlayModule, EntriesModule, EditorModule, LiveModule],
  controllers: [CheckupController],
  providers: [CheckupService, { provide: CHECKUP_CLOCK, useValue: () => Date.now() }],
})
export class CheckupModule {}
