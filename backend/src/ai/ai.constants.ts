/** Port of the MCP endpoint inside the container. HA maps it to a host port only when the user sets one. */
export const MCP_ENV = { port: "MCP_PORT" } as const;
export const DEFAULT_MCP_PORT = 8098;
export const MCP_PATH = "/mcp";
/** Injection token for the port the MCP endpoint listens on. */
export const MCP_PORT = Symbol("MCP_PORT");
/** Version of the tool set the AI sees; raise it when tools change. */
export const MCP_TOOLS_VERSION = "1.0.0";
/** How HA names the port in the app's network options. */
export const MCP_PORT_KEY = `${DEFAULT_MCP_PORT}/tcp`;

/** Tokens look like "hac_…"; long enough that guessing is hopeless. */
export const MCP_TOKEN_PREFIX = "hac_";
export const MCP_TOKEN_LENGTH = 32;
export const MCP_TOKEN_ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** MCP requests are small JSON-RPC messages; anything bigger is refused. */
export const MCP_MAX_BODY_BYTES = 1024 * 1024;

/** An AI should not flood the review list. */
export const MAX_OPEN_PLANS = 10;
/** Decided plans are kept a while, so the AI can still ask how a plan went. */
export const MAX_KEPT_PLANS = 30;
export const MAX_PLAN_OPERATIONS = 200;
export const PLAN_TITLE_MAX_LENGTH = 120;
export const PLAN_REASONING_MAX_LENGTH = 2000;
export const MAX_LISTED_ENTRIES = 2000;

/** Supervisor API: the app's own info, including which host port its MCP port is mapped to. */
export const SUPERVISOR_SELF_INFO_URL = "http://supervisor/addons/self/info";
