import { Module } from "@nestjs/common";

import { EditorModule } from "../editor/editor.module";
import { EntriesModule } from "../entries/entries.module";
import { DuplicateController } from "./duplicate.controller";
import { DuplicateService } from "./duplicate.service";

/** Duplicating automations and scripts with their folder, labels and area. */
@Module({
  imports: [EditorModule, EntriesModule],
  controllers: [DuplicateController],
  providers: [DuplicateService],
})
export class DuplicateModule {}
