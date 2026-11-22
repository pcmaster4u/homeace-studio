# Security

HomeAce Studio changes automations, scripts, scenes, helpers and registries in Home Assistant, so
security reports are taken seriously.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately instead:
[Security → Report a vulnerability](https://github.com/shadowtsw/homeace-studio/security/advisories/new).

Describe what is affected, how to reproduce it and which version you use (gear icon in the app).
You get an answer within a week. HomeAce Studio is a spare-time project, so a fix may take a little
longer; you will hear how it goes. Once it is fixed, the report is published together with the
release that fixes it, with credit if you like.

## Supported versions

Only the latest release gets fixes. Home Assistant shows when an update is available.

## What the app can reach

So you can judge the impact of a finding:

- **Home Assistant:** through the Supervisor's API proxy (`homeassistant_api`), with the token the
  Supervisor gives the app. That allows everything an administrator can do in Home Assistant.
- **Supervisor:** only its own app info (`hassio_api`), to show which port the AI access got.
- **Files:** only the app's own config folder (`addon_config`), where HomeAce Studio keeps its own
  extras (folder colors, notes, favorites). No access to `/config` of Home Assistant.
- **Network:** the UI is only reachable through Home Assistant's ingress, behind the Home Assistant
  login. The AI access (MCP) is closed by default; it needs a host port set by the user and has to be
  switched on in the app, and then requires a token.
