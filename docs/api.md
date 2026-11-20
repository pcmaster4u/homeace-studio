# API

All routes are under `/api`. Every response uses one envelope:
`{ message, error, data }`. `message` is always a message ID; the texts live in the
backend catalog (`GET /api/messages`). Below, "returns" means the content of `data`.

## GET /api/entries

All automations, scripts, scenes and helpers, sorted by name (case-insensitive).

```json
{
  "message": "OK",
  "error": false,
  "data": [
    {
      "entityId": "automation.terrasse_licht_bei_bewegung",
      "kind": "automation",
      "domain": "automation",
      "name": "Terrasse Licht bei Bewegung",
      "icon": "mdi:lightbulb-on",
      "categoryId": "01JD3…",
      "categoryPath": "Haus/Terrasse",
      "labels": [{ "labelId": "licht", "name": "Licht", "color": "amber" }],
      "area": { "areaId": "terrasse", "name": "Terrasse" },
      "state": "on",
      "isDisabled": false,
      "isHidden": false,
      "isInRegistry": true
    }
  ]
}
```

- `kind`: `automation` | `script` | `scene` | `helper`.
- Helpers are the HA-managed domains (`input_*`, `counter`, `timer`, `schedule`) plus entities of config entries
  of type `helper` (template, group, utility_meter, …), so `domain` can be e.g. `sensor` or `light`.
- `icon`: the user's icon, else the icon from the state; `null` means "default icon of the kind".
- `categoryPath` is the category name from the scope that fits the kind (`helpers` for helpers); `null` when not
  categorized. Labels HA no longer knows are left out.
- `state` is `null` for disabled entities (HA has no state for them).
- `isInRegistry: false`: the entity exists only as state (YAML without `unique_id`); it cannot have a category,
  labels or an area.
- `isFavorite`, `note`: own extras from the overlay (not in HA).

## PATCH /api/entries/:entityId

Changes what HA keeps in its entity registry. Every field is optional; missing ones stay.

```json
{ "name": "Licht Terrasse", "icon": "mdi:lightbulb", "areaId": "terrasse", "labelIds": ["licht"] }
```

- A blank `name` or `icon` goes back to the default of the integration (sent to HA as `null`).
- Returns the updated entry with `ENTRY_UPDATED`. `400 ENTRY_NOT_IN_REGISTRY` for YAML-only entities.

## PATCH /api/entries/:entityId/extras

`{ "isFavorite": true, "note": "…" }`, both optional; a blank or null note is removed. Overlay only.
Returns `null` with `ENTRY_EXTRAS_SAVED`.

## POST /api/entries/:entityId/run · /turn-on · /turn-off

Calls the matching HA service: run = `automation.trigger` (ignores conditions), `script.turn_on`,
`scene.turn_on`, `input_button.press`; turn-on/off = `automation.*`, `input_boolean.*`; turn-off also
stops a running `script`. Returns `null` with `ENTRY_ACTION_DONE`;
`400 ENTRY_ACTION_UNSUPPORTED` (`params.entityId`, `params.action`) for other domains.

## GET /api/areas · GET /api/labels

HA's areas `[{ areaId, name, icon }]` and labels `[{ labelId, name, icon, color }]`, sorted by name.

`GET /api/entities` lists every entity HA has, for the entity picker of the flow editor:
`[{ entityId, name, domain, state, options }]`, sorted by name. `options` holds the possible states of
select-like entities (input_select, select, enum sensors), otherwise `null`.

## POST /api/entries/:entityId/move

Puts an entry into a folder. Written straight to HA's entity registry.

```json
{ "categoryPath": "Haus/Pool" }
```

- `categoryPath: null` takes the entry out of its category.
- The path is normalized (levels trimmed). If HA has no category with that name in the entry's scope, it is
  created and remembered as owned by HomeAce Studio (overlay). If the old category is now empty and owned,
  it is deleted. User-made categories are never deleted.
- Returns `null` with message `ENTRY_MOVED`.
- Errors: `404 ENTRY_NOT_FOUND` (`params.entityId`), `400 ENTRY_NOT_IN_REGISTRY`,
  `400 CATEGORY_PATH_INVALID` (`params.path`, a level is empty), `400 VALIDATION_FAILED`.

## POST /api/categories/rename

Renames a folder and everything below it, in all four scopes.

```json
{ "from": "Haus", "to": "Heim" }
```

- Returns `{ "renamedCount": 3 }` with message `CATEGORY_RENAMED`.
- All scopes are checked before anything changes. If a new name already exists in a scope, nothing is renamed:
  `409 CATEGORY_NAME_TAKEN` (`params.path`).
- `400 CATEGORY_MOVE_INTO_ITSELF` when `to` lies below `from` (e.g. `Haus` → `Haus/Neu`).
- Folders that are only a prefix (no HA category of their own) work too: their subcategories are renamed.

## Tidy-up assistant: /api/categories/cleanup

- `GET` → `{ proposals, ignoredCount }`. A proposal is either
  `{ key: "split:Office - Heating", kind: "split", from, to: "Office/Heating", isCertain, counts }`
  (a top-level name with a dash; `isCertain` is false for a dash without spaces, which may belong to
  the name) or `{ key: "merge:Routine|Routines", kind: "merge", names, to, counts }` (names that only
  differ by an ending; `to` is the one with most entries, on a tie the longer one). `counts` are entries
  per scope. Hidden proposals are left out.
- `POST /preview` `{ changes: [{ from, to }] }` → `{ steps: [{ scope, kind: "rename" | "merge", from, to,
  entryCount }] }`. Per scope, in order: a rename when `to` is free there, a merge (entries move, the emptied
  category is deleted) when `to` already exists or an earlier change produced it.
- `POST /apply` with the same body plans again from HA's current state and runs the steps →
  `{ categoryCount, stepCount }`, `CLEANUP_APPLIED`. Folder colors and empty folders move to the new path.
  `400 CATEGORY_PATH_INVALID` for an empty level, `400 CLEANUP_DUPLICATE` when a name is listed twice.
- `POST /ignore` `{ key }` hides a proposal (overlay `cleanupIgnored`, `CLEANUP_IGNORED`);
  `DELETE /ignore` shows all again (`CLEANUP_RESTORED`).

## Folders: GET /api/folders, POST /api/folders, DELETE /api/folders?path=…

Empty folders the user created in the tree. They live only in the overlay; HA has no empty categories and gets
the category when the first entry moves in (`POST /api/entries/:id/move`).

- `GET` returns `{ "saved": ["Haus/Pool"], "colors": { "Haus": "#e3a64e" } }`: saved empty folders (sorted)
  and own folder colors.
- `PUT /api/folders/color { "path": "Haus", "color": "#e3a64e" }` sets a color (`#rrggbb`); `color: null`
  removes it. Returns `null` with `FOLDER_COLOR_SAVED`. Colors move along when a folder is renamed.
- `POST { "path": "Haus/Pool" }` returns `{ "path": "Haus/Pool" }` (levels trimmed) with `FOLDER_CREATED`;
  `409 FOLDER_EXISTS`, `400 CATEGORY_PATH_INVALID`.
- `DELETE ?path=Haus%2FPool` (path in the query, because it contains "/") returns `null` with
  `FOLDER_DELETED`; `404 FOLDER_NOT_FOUND`. HA categories are never touched.
- Renaming a folder (`POST /api/categories/rename`) renames saved folders below it too.

## POST /api/helpers

Creates a helper in HA and optionally sorts it into a folder.

```json
{
  "type": "input_number",
  "name": "Terrasse Helligkeit",
  "icon": "mdi:brightness-6",
  "categoryPath": "Haus/Terrasse",
  "settings": { "min": 10, "max": 100, "step": 5, "unitOfMeasurement": "%" }
}
```

- `type`: `input_boolean`, `input_button`, `input_number`, `input_text`, `input_select`, `input_datetime`,
  `counter`, `timer`.
- `settings` per type (camelCase; mapped to HA's names in `backend/src/helpers/helper-payload.ts`):
  - `input_number`: `min`, `max` (required, max > min), `step` (1), `mode` (`slider` | `box`), `unitOfMeasurement`
  - `input_text`: `min` (0), `max` (100, at most 255), `mode` (`text` | `password`), `pattern`
  - `input_select`: `options` (at least one, no blanks, no duplicates)
  - `input_datetime`: `hasDate`, `hasTime` (at least one true)
  - `counter`: `initial` (0), `step` (1), `minimum`, `maximum`, `restore` (true)
  - `timer`: `duration` (`HH:MM:SS`), `restore` (false)
- Returns `{ "entityId": "input_number.terrasse_helligkeit" }` with `HELPER_CREATED` (201).
- `400 HELPER_SETTINGS_INVALID` (`params.field`, the camelCase name) before anything is created in HA.
- `DELETE /api/helpers/:entityId` deletes a storage helper (the 8 types above) via `<type>/delete`, removes
  its favorite and note, and deletes its category if HomeAce Studio created it and it became empty.
  `400 HELPER_NOT_DELETABLE` for template, group and other config-entry helpers; `404 ENTRY_NOT_FOUND`.
- HA registers the entity a moment after creating the helper; the backend looks it up a few times
  (10 × 200 ms) before sorting it into the folder.

## GET /api/events

Server-sent events (no envelope). After relevant changes in HA, a default message with
`{ "type": "changed" }` (bursts are combined: one message 500 ms after the last change); every 25 s a
`ping` event as heartbeat for proxies. The UI reloads its entries on `changed`.

Relevant are: registry changes (entities, categories, labels, areas) and real state changes of
automations, scripts, scenes and HA-managed helpers. Sensor and attribute-only changes are ignored.

## GET /api/editor/catalog?lang=de

All trigger, condition and action types HA describes, with translated names and fields:
`{ triggers: { "zone.entered": { name, description, fields: { for: { name, required, default, selector } },
target } }, conditions: {…}, actions: { "climate.set_temperature": {…} } }`. Built from
`trigger_platforms/subscribe`, `condition_platforms/subscribe`, `get_services` and `frontend/get_translations`;
cached 10 minutes per language (`de`, `en`; others fall back to `de`). Classic triggers like `state` are not
in it; the UI has its own blocks for them.

## GET /api/editor/flows/:entityId

`{ entityId, kind: "automation" | "script", config, entityNames, isEditable }`: the config as HA keeps it
(`automation/config`, `script/config`) and the names of all entities it mentions.
`isEditable` is true when the flow lives in automations.yaml / scripts.yaml (REST
`GET /api/config/<kind>/config/<key>` finds it) and is not built from a blueprint. The key is the
automation's `id`, or the script's unique ID from the entity registry (it stays the same when the
entity ID is renamed). `400 FLOW_UNSUPPORTED` for other entries.

## PUT /api/editor/flows/:entityId

Body `{ "config": { … } }`: the whole config, as GET returned it plus the edits. Fields the editor does
not know must come back unchanged. The backend writes it with REST `POST /api/config/<kind>/config/<key>`;
HA validates it and reloads the flow. For automations the `id` is always set to the stored one.

- Returns the saved flow (same shape as GET) with `FLOW_SAVED`. It is built from the sent config, because
  HA reloads in the background and could still return the old version for a moment.
- `400 FLOW_NOT_EDITABLE` (`params.entityId`) when `isEditable` would be false.
- `400 FLOW_INVALID` (`params.reason`, HA's own text) when HA rejects the config.

## POST /api/flows · DELETE /api/flows/:entityId

`POST` body `{ kind: "automation" | "script", name, categoryPath? }` creates an empty flow in
automations.yaml / scripts.yaml (REST `POST /api/config/<kind>/config/<key>`) and sorts it into the folder.
An automation gets the current time in milliseconds as `id` (like HA's editor), no triggers and no actions,
so it never runs on its own; a script gets a key from its name (`Gute Nacht` → `gute_nacht`, `_2`, `_3`, …
when taken) and an empty sequence. The backend waits up to 25 × 200 ms for HA to register the entity.
Returns `{ "entityId": "automation.licht_flur" }` with `FLOW_CREATED`; `400 FLOW_INVALID` when HA
rejects it.

`DELETE` removes the flow from its file (REST `DELETE /api/config/<kind>/config/<key>`), its favorite and
note, and its category if HomeAce Studio created it and it became empty. `FLOW_DELETED`;
`400 FLOW_NOT_EDITABLE` for flows outside those files.

## GET /api/messages?lang=de

The backend catalog: message ID → text, for `de` (default) and `en`. Placeholders like `{path}` are filled from
`data.params` of an error. Sent with `Cache-Control: no-cache` and an ETag, so reloads cost a `304`.
