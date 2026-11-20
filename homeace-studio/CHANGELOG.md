# Changelog

## 0.7.2

- Fixed: a strip at the bottom of the window where the columns ended too early.
- Fixed: short labels inside a value (e.g. "Message") no longer break in the middle of the word.
- Opening a value editor no longer shifts the columns.

## 0.7.1

- Subfolders without a color of their own take the color of their nearest colored parent folder.

## 0.7.0

- "Neu" in the list now creates automations and scripts as well as helpers: give a name and a
  folder, and the new, empty flow opens right away for filling in.
- Delete automations and scripts (those kept in automations.yaml / scripts.yaml).

## 0.6.0

- Add triggers, conditions and actions with "+ Auslöser", "+ Bedingung" and "+ Aktion", also inside
  if/then/else, choose, repeat and groups. The picker offers the common blocks first, then every type
  Home Assistant describes, with search.
- Block menu (⋮): move up or down, duplicate, disable (kept in the config) or enable, delete.
- Values a block still needs are shown in orange until they are set.

## 0.5.1

- Folder groups in the list can be collapsed and expanded. Subfolders start collapsed; the folder's own
  entries, the open entry and search results stay visible. Each group shows how many entries it holds.

## 0.5.0

- Edit automations and scripts in the tab "Ablauf": tap a value (entity, state, number, duration,
  time, choice, template) to change it, add optional fields with "+ Option", remove them again.
- Choose how a running flow reacts when it starts again (ignore, restart, queue, parallel).
- Edits stay unsaved until "In HA speichern"; the list marks entries with unsaved edits. Fields
  HomeAce Studio does not know are saved back unchanged.
- Flows outside automations.yaml / scripts.yaml (packages, blueprints) are shown read-only.

## 0.4.0

- New tab "Ablauf" for automations and scripts: triggers, conditions and actions as readable blocks with
  names from Home Assistant (German and English). Read-only for now; editing follows.

## 0.3.0

- Edit name, icon, area and labels of an entry (saved in Home Assistant).
- Switch automations and toggles on or off; run automations, scripts and scenes; press buttons.
- Delete helpers (toggle, button, number, text, dropdown, date/time, counter, timer).
- Favorites, own notes and folder colors (kept in HomeAce Studio only).
- Live updates: changes in Home Assistant show up on their own.

## 0.2.0

- Create empty folders in the tree, also as subfolders; delete empty ones.
- Create helpers with a form per type, sorted into a folder right away.

## 0.1.0

- First version: automations, scripts, scenes and helpers in one list with nested categories
  (`Haus/Terrasse`), move entries by drag and drop, rename folders with a preview.
