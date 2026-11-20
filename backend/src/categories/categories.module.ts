import { Module } from "@nestjs/common";

import { HaModule } from "../ha/ha.module";
import { OverlayModule } from "../overlay/overlay.module";
import { CATEGORY_REPOSITORY } from "./categories.constants";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { FoldersController } from "./folders.controller";
import { FoldersService } from "./folders.service";
import { HaCategoriesRepository } from "./repositories/ha-categories.repository";

@Module({
  imports: [HaModule, OverlayModule],
  controllers: [CategoriesController, FoldersController],
  providers: [
    CategoriesService,
    FoldersService,
    { provide: CATEGORY_REPOSITORY, useClass: HaCategoriesRepository },
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
