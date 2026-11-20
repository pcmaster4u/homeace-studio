/**
 * Demo mode: the backend talks to an invented home kept in memory instead of a real Home Assistant.
 * For screenshots, trying the UI without HA, and development. Nothing is saved; a restart resets it.
 */
export const DEMO_ENV = "HOMEACE_DEMO";

/** Values of {@link DEMO_ENV} that switch the demo on. */
export const DEMO_ON_VALUES: ReadonlySet<string> = new Set(["1", "true", "yes", "on"]);

/** Placeholder endpoint for demo mode; nothing ever connects to it. */
export const DEMO_ENDPOINT = {
  restUrl: "http://demo.invalid/api",
  websocketUrl: "ws://demo.invalid/api/websocket",
  token: "demo",
  isAddon: false,
} as const;

/** Events reach subscribers a moment later, like over a real connection. */
export const DEMO_EVENT_DELAY_MS = 20;

export function isDemoMode(value: string | undefined): boolean {
  return DEMO_ON_VALUES.has((value ?? "").trim().toLowerCase());
}
