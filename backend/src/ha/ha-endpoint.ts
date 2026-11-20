import {
  LOCAL_REST_PATH,
  LOCAL_WEBSOCKET_PATH,
  SUPERVISOR_REST_URL,
  SUPERVISOR_WEBSOCKET_URL,
} from "./ha.constants";

export type HaEndpoint = {
  restUrl: string;
  websocketUrl: string;
  token: string;
  isAddon: boolean;
};

export type HaEndpointSettings = {
  haUrl?: string;
  haToken?: string;
  supervisorToken?: string;
};

const TRAILING_SLASHES = /\/+$/;
/** Replacing the leading "http" with "ws" turns http → ws and https → wss in one step. */
const HTTP_SCHEME_START = /^http/;

/**
 * Decides how to reach Home Assistant.
 *
 * Inside the add-on the Supervisor token wins and the Supervisor proxy is used.
 * Otherwise (local development) HA_URL and HA_TOKEN are required.
 *
 * @param settings - Raw values from the environment; blank values count as missing.
 * @returns REST and WebSocket addresses plus the token to authenticate with.
 * @throws Error when neither the Supervisor token nor HA_URL + HA_TOKEN are set.
 * @example resolveHaEndpoint({ haUrl: "https://ha.local:8123/", haToken: "abc" }).websocketUrl
 *          // "wss://ha.local:8123/api/websocket"
 */
export function resolveHaEndpoint(settings: HaEndpointSettings): HaEndpoint {
  const supervisorToken = settings.supervisorToken?.trim();

  if (supervisorToken) {
    return {
      restUrl: SUPERVISOR_REST_URL,
      websocketUrl: SUPERVISOR_WEBSOCKET_URL,
      token: supervisorToken,
      isAddon: true,
    };
  }

  const baseUrl = settings.haUrl?.trim().replace(TRAILING_SLASHES, "");
  const token = settings.haToken?.trim();

  if (!baseUrl || !token) {
    throw new Error(
      "Home Assistant is not configured: set HA_URL and HA_TOKEN in .env, or run as add-on.",
    );
  }

  const websocketBaseUrl = baseUrl.replace(HTTP_SCHEME_START, "ws");

  return {
    restUrl: baseUrl + LOCAL_REST_PATH,
    websocketUrl: websocketBaseUrl + LOCAL_WEBSOCKET_PATH,
    token,
    isAddon: false,
  };
}
