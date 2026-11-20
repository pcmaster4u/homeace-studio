# HomeAce Studio

A clearer UI for automations, scripts, scenes and helpers.

- **Nested categories:** folders like `Haus/Terrasse` are stored as normal HA categories with `/` in the name,
  so they stay readable in the HA UI too.
- **Move** entries by dragging them onto a folder, or with the category field in the detail view. Missing
  categories are created and emptied ones (created by HomeAce Studio) are removed automatically.
- **Rename** a folder and everything below it in one go, with a preview.

## Installation (local app)

Since HA 2026.2, add-ons are called **apps** in the UI; it is the same thing.

1. Copy the add-on folder to `/addons/homeace_studio` on your HA (e.g. with the "Samba share" app).
2. Settings → Apps → App store → ⋮ → Check for updates, then reload the page.
3. Open "HomeAce Studio" under "Local apps", install, start, and turn on "Show in sidebar".

The first build takes a few minutes, because the image is built on your HA.

## AI access (MCP)

An AI client such as Claude Code can propose folder plans. It reads names, kinds, folders, areas
and labels, never flows, states or notes, and it cannot change anything: every plan waits in
HomeAce Studio until you apply it.

1. Settings → Apps → HomeAce Studio → Configuration → Network: enter a host port for
   "AI access (MCP)", e.g. 8098, save and restart the app. Without a port the endpoint is closed.
2. In HomeAce Studio: gear icon → AI access (MCP) → switch it on. A token is created.
3. Copy the command shown there, e.g. for Claude Code:
   `claude mcp add --transport http homeace http://<your-ha>:8098/mcp --header "Authorization: Bearer <token>"`

The port is meant for your home network. Do not forward it to the internet. "Create new" replaces
the token at once.

## Data

HomeAce Studio has no database. Its own extras live in `overlay.json` in the add-on's config folder
(`/addon_configs/<id>_homeace_studio/`), which is part of HA backups.
