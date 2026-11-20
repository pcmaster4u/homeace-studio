import { Module } from "@nestjs/common";

import { HaModule } from "../ha/ha.module";
import { LookupsController } from "./lookups.controller";

@Module({
  imports: [HaModule],
  controllers: [LookupsController],
})
export class LookupsModule {}
