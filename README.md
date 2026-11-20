# HomeAce Studio

**A calmer, clearer home for your Home Assistant automations, scripts, scenes and helpers.**
Real folders instead of one long list, flows you read like sentences, and no YAML in sight.

![HomeAce Studio: folder tree, entry list and the visual editor of an automation](docs/images/overview-light.png)

HomeAce Studio is a Home Assistant app (add-on). It works on top of what HA already stores:
your categories, entities and automations stay in Home Assistant and keep working without it.

> **Status: early preview.** It is used on its author's own Home Assistant, but it is young. Make a backup
> before you let it change things, and expect rough edges.

## What it does

**Folders that nest.** HA categories are flat. HomeAce Studio shows `House/Terrace` as a folder
inside `House`, in every scope at once, and stores it in HA as a normal category, so HA's own UI
still reads it. Drag entries onto folders, rename a folder with a preview of every HA category it
touches, and give folders colors that subfolders inherit.

**Flows as sentences.** Automations read as *When … / And only if … / Then …*, scripts as a
sequence. Tap any value to change it in a small editor made for its type (entity, state, number,
duration, time, option list). Add, move, duplicate, disable or delete blocks; nested *if / then*,
*choose*, *repeat* and *parallel* blocks are shown as such. Nothing reaches HA until you choose
*Save to HA*, and blocks it does not know yet survive a save untouched.

![The flow of an automation with an if / then block, in dark mode](docs/images/flow-dark.png)

**Everything about an entry in one place.** Name, icon, area, labels, folder, on/off, run, notes
and favorites (the last two live only in HomeAce Studio). Create automations, scripts and eight
kinds of helpers in a few clicks; delete them again when they are not needed.

![Editing a value right inside the flow](docs/images/editing-light.png)

**Made to be used everywhere.** Light and dark mode, German and English, all columns resizable,
and on a phone the list comes first and the details slide in full screen. Technical details such
as entity IDs stay hidden until you switch them on.

<p align="center">
  <img src="docs/images/phone-dark.png" alt="Folder list on a phone, dark mode" width="300">
  &nbsp;&nbsp;
  <img src="docs/images/phone-flow-light.png" alt="A script's flow on a phone" width="300">
</p>

**Live.** Changes made in HA show up right away, without reloading.

## Coming next

- **Tidy-up assistant:** turns old categories like `Office - Heating` into real subfolders and
  merges near-duplicates, line by line with a preview.
- **Folder plans from an AI:** an optional MCP endpoint, so an assistant such as Claude can propose
  a folder structure that you review and apply in HomeAce Studio.
- Run history and dependencies at a glance, editing helper settings, scenes, and a blueprint editor
  that turns any automation into a blueprint.
- Installing from the HA app store with ready-made images.

## Try it without Home Assistant

A demo mode runs the whole UI against an invented home kept in memory (Node.js 22 or newer):

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm run build
HOMEACE_DEMO=true PORT=3100 STATIC_DIR=../frontend/dist node dist/main.js
```

Then open <http://localhost:3100>. Everything works, nothing is saved. The screenshots above come
from this demo.

## Install on Home Assistant

For now HomeAce Studio installs as a *local app* on HA OS: [docs/setup.md](docs/setup.md#as-an-add-on-local-app-on-ha-os)
explains it step by step. An app repository you can simply add in HA follows soon.

## For developers

```text
frontend/        Vue 3 + TypeScript, own components, vue-i18n
backend/         NestJS; talks to HA over its WebSocket and REST APIs and serves the built UI
homeace-studio/  app definition for HA: config.yaml, Dockerfile, DOCS.md, CHANGELOG.md
scripts/         build-addon.mjs (assembles the app folder), screenshots.mjs (README pictures)
docs/            setup, architecture, API, decisions
```

Local development against a real HA, tests and the app build are described in
[docs/setup.md](docs/setup.md); the design is in [docs/architecture.md](docs/architecture.md).

## License

[MIT](LICENSE). HomeAce Studio is an independent project and not affiliated with Home Assistant or
Nabu Casa.
