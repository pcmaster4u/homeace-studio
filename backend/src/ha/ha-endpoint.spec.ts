import { resolveHaEndpoint } from "./ha-endpoint";
import { SUPERVISOR_REST_URL, SUPERVISOR_WEBSOCKET_URL } from "./ha.constants";

describe("resolveHaEndpoint", () => {
  it("uses the Supervisor proxy when a Supervisor token is set", () => {
    const endpoint = resolveHaEndpoint({
      supervisorToken: "supervisor-token",
      haUrl: "http://ha.local:8123",
      haToken: "local-token",
    });

    expect(endpoint).toEqual({
      restUrl: SUPERVISOR_REST_URL,
      websocketUrl: SUPERVISOR_WEBSOCKET_URL,
      token: "supervisor-token",
      isAddon: true,
    });
  });

  it("builds local addresses from HA_URL and strips trailing slashes", () => {
    const endpoint = resolveHaEndpoint({ haUrl: "http://192.168.1.20:8123//", haToken: "token" });

    expect(endpoint.restUrl).toBe("http://192.168.1.20:8123/api");
    expect(endpoint.websocketUrl).toBe("ws://192.168.1.20:8123/api/websocket");
    expect(endpoint.isAddon).toBe(false);
  });

  it("uses wss for an https HA_URL", () => {
    const endpoint = resolveHaEndpoint({ haUrl: "https://ha.example.org", haToken: "token" });

    expect(endpoint.websocketUrl).toBe("wss://ha.example.org/api/websocket");
  });

  it("throws when nothing is configured", () => {
    expect(() => resolveHaEndpoint({ haUrl: " ", haToken: "token" })).toThrow(
      "Home Assistant is not configured",
    );
  });
});
