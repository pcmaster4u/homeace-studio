import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { API_PREFIX, APP_ENV, DEFAULT_PORT } from "./app.constants";
import { AppModule } from "./app.module";
import { VALIDATION_PIPE_OPTIONS } from "./common/pipes/validation-pipe.options";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const staticDir = config.get<string>(APP_ENV.staticDir)?.trim();

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));

  // In the add-on one container serves both: the UI from / and the API from /api.
  // The frontend uses hash routes, so no fallback to index.html is needed.
  if (staticDir) {
    app.useStaticAssets(staticDir);
    new Logger("Bootstrap").log(`Serving the UI from ${staticDir}`);
  }

  await app.listen(config.get<number>(APP_ENV.port) ?? DEFAULT_PORT);
}

void bootstrap();
