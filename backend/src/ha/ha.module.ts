import { Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { DEMO_ENDPOINT, DEMO_ENV, isDemoMode } from "../demo/demo.constants";
import { createDemoHome } from "../demo/demo-home";
import { DemoHaConnectionService, DemoHaRestService } from "../demo/demo-ha.services";
import { FakeHa } from "../demo/fake-ha";
import { HaConnectionService } from "./ha-connection.service";
import { HaRestService } from "./ha-rest.service";
import { resolveHaEndpoint, type HaEndpoint } from "./ha-endpoint";
import { FAKE_HA, HA_ENDPOINT, HA_ENV } from "./ha.constants";

@Module({
  providers: [
    {
      // The invented home of demo mode (HOMEACE_DEMO=true); null when talking to a real HA.
      provide: FAKE_HA,
      inject: [ConfigService],
      useFactory: (config: ConfigService): FakeHa | null => {
        if (!isDemoMode(config.get<string>(DEMO_ENV))) return null;

        new Logger("HaModule").warn("Demo mode: using an invented home, nothing is saved");

        return new FakeHa(createDemoHome());
      },
    },
    {
      // Resolved once at startup, so a missing configuration fails immediately with a clear message.
      provide: HA_ENDPOINT,
      inject: [ConfigService, FAKE_HA],
      useFactory: (config: ConfigService, fake: FakeHa | null): HaEndpoint =>
        fake
          ? { ...DEMO_ENDPOINT }
          : resolveHaEndpoint({
              haUrl: config.get<string>(HA_ENV.url),
              haToken: config.get<string>(HA_ENV.token),
              supervisorToken: config.get<string>(HA_ENV.supervisorToken),
            }),
    },
    {
      provide: HaConnectionService,
      inject: [HA_ENDPOINT, FAKE_HA],
      useFactory: (endpoint: HaEndpoint, fake: FakeHa | null): HaConnectionService =>
        fake ? new DemoHaConnectionService(fake) : new HaConnectionService(endpoint),
    },
    {
      provide: HaRestService,
      inject: [HA_ENDPOINT, FAKE_HA],
      useFactory: (endpoint: HaEndpoint, fake: FakeHa | null): HaRestService =>
        fake ? new DemoHaRestService(fake) : new HaRestService(endpoint),
    },
  ],
  exports: [HaConnectionService, HaRestService, FAKE_HA, HA_ENDPOINT],
})
export class HaModule {}
