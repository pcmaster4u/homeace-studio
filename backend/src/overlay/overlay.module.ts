import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { DEMO_ENV, isDemoMode } from "../demo/demo.constants";
import { createDemoHome } from "../demo/demo-home";
import { MemoryOverlayRepository } from "../demo/memory-overlay.repository";
import {
  DEFAULT_OVERLAY_FILE,
  OVERLAY_ENV,
  OVERLAY_FILE_PATH,
  OVERLAY_REPOSITORY,
} from "./overlay.constants";
import type { OverlayRepository } from "./repositories/overlay.repository";
import { FileOverlayRepository } from "./repositories/file-overlay.repository";

@Module({
  providers: [
    {
      provide: OVERLAY_FILE_PATH,
      inject: [ConfigService],
      useFactory: (config: ConfigService): string =>
        config.get<string>(OVERLAY_ENV.file)?.trim() || DEFAULT_OVERLAY_FILE,
    },
    {
      // Demo mode keeps its overlay in memory, seeded with folder colors, favorites and a note.
      provide: OVERLAY_REPOSITORY,
      inject: [ConfigService, OVERLAY_FILE_PATH],
      useFactory: (config: ConfigService, filePath: string): OverlayRepository =>
        isDemoMode(config.get<string>(DEMO_ENV))
          ? new MemoryOverlayRepository(createDemoHome().overlay)
          : new FileOverlayRepository(filePath),
    },
  ],
  exports: [OVERLAY_REPOSITORY],
})
export class OverlayModule {}
