import { Module } from "@nestjs/common";

import { CategoriesModule } from "../categories/categories.module";
import { ENTITY_LOOKUP_WAIT, wait } from "../common/utils/wait";
import { HaModule } from "../ha/ha.module";
import { OverlayModule } from "../overlay/overlay.module";
import { EDITOR_REPOSITORY, FLOW_CLOCK } from "./editor.constants";
import { EditorController } from "./editor.controller";
import { EditorService } from "./editor.service";
import { FlowsController } from "./flows.controller";
import { FlowsService } from "./flows.service";
import { HaEditorRepository } from "./repositories/ha-editor.repository";

@Module({
  imports: [HaModule, OverlayModule, CategoriesModule],
  controllers: [EditorController, FlowsController],
  providers: [
    EditorService,
    FlowsService,
    { provide: EDITOR_REPOSITORY, useClass: HaEditorRepository },
    { provide: ENTITY_LOOKUP_WAIT, useValue: wait },
    { provide: FLOW_CLOCK, useValue: () => Date.now() },
  ],
  exports: [EDITOR_REPOSITORY],
})
export class EditorModule {}
