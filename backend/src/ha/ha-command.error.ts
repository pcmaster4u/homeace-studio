/** Home Assistant answered a WebSocket command with `success: false`. */
export class HaCommandError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = HaCommandError.name;
  }
}
