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

## Data

HomeAce Studio has no database. Its own extras live in `overlay.json` in the add-on's config folder
(`/addon_configs/<id>_homeace_studio/`), which is part of HA backups.
