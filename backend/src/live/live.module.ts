import { Module } from "@nestjs/common";

import { HaModule } from "../ha/ha.module";
import { LiveController } from "./live.controller";
import { LiveService } from "./live.service";

@Module({
  imports: [HaModule],
  controllers: [LiveController],
  providers: [LiveService],
  exports: [LiveService],
})
export class LiveModule {}
