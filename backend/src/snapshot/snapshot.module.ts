import { Module } from "@nestjs/common";

import { EditorModule } from "../editor/editor.module";
import { EntriesModule } from "../entries/entries.module";
import { HaModule } from "../ha/ha.module";
import { LiveModule } from "../live/live.module";
import { HomeSnapshotService } from "./home-snapshot.service";
import { SNAPSHOT_CLOCK } from "./snapshot.constants";

/** One shared read of entries, states, registry and flow configs (check-up, dependencies, area view). */
@Module({
  imports: [HaModule, EntriesModule, EditorModule, LiveModule],
  providers: [HomeSnapshotService, { provide: SNAPSHOT_CLOCK, useValue: () => Date.now() }],
  exports: [HomeSnapshotService],
})
export class SnapshotModule {}
