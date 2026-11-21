import { Module } from "@nestjs/common";

import { EditorModule } from "../editor/editor.module";
import { HaModule } from "../ha/ha.module";
import { TracesController } from "./traces.controller";
import { TracesService } from "./traces.service";

/** Run history ("Verlauf") from HA's traces. */
@Module({
  imports: [HaModule, EditorModule],
  controllers: [TracesController],
  providers: [TracesService],
  exports: [TracesService],
})
export class TracesModule {}
