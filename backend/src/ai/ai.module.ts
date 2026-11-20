import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CategoriesModule } from "../categories/categories.module";
import { EntriesModule } from "../entries/entries.module";
import { HaModule } from "../ha/ha.module";
import { LiveModule } from "../live/live.module";
import { OverlayModule } from "../overlay/overlay.module";
import { AiController } from "./ai.controller";
import { AiPlansService } from "./ai-plans.service";
import { DEFAULT_MCP_PORT, MCP_ENV, MCP_PORT } from "./ai.constants";
import { McpAccessService } from "./mcp-access.service";
import { McpHttpServer } from "./mcp-http.server";

/** AI folder plans: the MCP endpoint for AI clients and the review side for the UI. */
@Module({
  imports: [HaModule, OverlayModule, CategoriesModule, EntriesModule, LiveModule],
  controllers: [AiController],
  providers: [
    {
      provide: MCP_PORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): number =>
        Number(config.get<string>(MCP_ENV.port)) || DEFAULT_MCP_PORT,
    },
    AiPlansService,
    McpAccessService,
    McpHttpServer,
  ],
})
export class AiModule {}
