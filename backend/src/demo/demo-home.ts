import type { HaPlatformDescription, HaServices, HaTranslations } from "../editor/catalog.mapper";
import type { HaArea, HaConfigEntry, HaLabel } from "../ha/ha.types";
import type { Overlay } from "../overlay/overlay.model";

/** One entity of the demo home, in a compact form the fake HA turns into registry entries and states. */
export type DemoEntity = {
  entityId: string;
  name: string;
  state: string;
  /** Integration that owns it; automations, scripts and helpers use their domain. */
  platform: string;
  uniqueId?: string;
  /** Category path in the entity's scope, e.g. "House/Terrace". */
  category?: string;
  areaId?: string;
  labels?: string[];
  icon?: string;
  /** Set for config-entry helpers such as template sensors. */
  configEntryId?: string;
  isDisabled?: boolean;
  attributes?: Record<string, unknown>;
  /** Automation or script config, as automations.yaml / scripts.yaml store it. */
  config?: Record<string, unknown>;
};

export type DemoHome = {
  areas: HaArea[];
  labels: HaLabel[];
  entities: DemoEntity[];
  helperConfigEntries: HaConfigEntry[];
  services: HaServices;
  /** Per language, per translation category ("services"), HA's flat translation keys. */
  translations: Record<string, Record<string, HaTranslations>>;
  /** Own extras the demo starts with: folder colors, favorites, notes. */
  overlay: Pick<Overlay, "folderColors" | "favorites" | "notes">;
};

/** HA's editor stores durations like this. */
function duration(minutes: number, seconds = 0): Record<string, number> {
  return { hours: 0, minutes, seconds, milliseconds: 0 };
}

function target(domain: string): HaPlatformDescription["target"] {
  return { entity: [{ domain: [domain] }] };
}

const NUMBER_PERCENT = { number: { min: 0, max: 100, unit_of_measurement: "%", mode: "slider" } };

const SERVICES: HaServices = {
  light: {
    turn_on: {
      target: target("light"),
      fields: { brightness_pct: { selector: NUMBER_PERCENT } },
    },
    turn_off: { target: target("light") },
  },
  cover: {
    open_cover: { target: target("cover") },
    close_cover: { target: target("cover") },
  },
  switch: { turn_on: { target: target("switch") }, turn_off: { target: target("switch") } },
  valve: { open_valve: { target: target("valve") }, close_valve: { target: target("valve") } },
  climate: {
    set_temperature: {
      target: target("climate"),
      fields: {
        temperature: {
          required: true,
          selector: { number: { min: 7, max: 35, step: 0.5, unit_of_measurement: "°C" } },
        },
      },
    },
  },
  notify: {
    notify: {
      fields: {
        message: { required: true, selector: { text: {} } },
        title: { selector: { text: {} } },
      },
    },
  },
  counter: { increment: { target: target("counter") } },
  input_select: {
    select_option: {
      target: target("input_select"),
      fields: { option: { required: true, selector: { text: {} } } },
    },
  },
  timer: { start: { target: target("timer") } },
  alarm_control_panel: { alarm_arm_away: { target: target("alarm_control_panel") } },
  scene: { turn_on: { target: target("scene") } },
  script: { turn_on: { target: target("script") } },
};

/** Service names and field names, as `frontend/get_translations` delivers them. */
const SERVICE_TEXTS: Record<string, Record<string, string>> = {
  en: {
    "light.turn_on": "Turn on",
    "light.turn_on.brightness_pct": "Brightness",
    "light.turn_off": "Turn off",
    "cover.open_cover": "Open",
    "cover.close_cover": "Close",
    "switch.turn_on": "Turn on",
    "switch.turn_off": "Turn off",
    "valve.open_valve": "Open",
    "valve.close_valve": "Close",
    "climate.set_temperature": "Set target temperature",
    "climate.set_temperature.temperature": "Temperature",
    "notify.notify": "Send a notification",
    "notify.notify.message": "Message",
    "notify.notify.title": "Title",
    "counter.increment": "Increment",
    "input_select.select_option": "Select",
    "input_select.select_option.option": "Option",
    "timer.start": "Start",
    "alarm_control_panel.alarm_arm_away": "Arm away",
    "scene.turn_on": "Activate",
    "script.turn_on": "Turn on",
  },
  de: {
    "light.turn_on": "Einschalten",
    "light.turn_on.brightness_pct": "Helligkeit",
    "light.turn_off": "Ausschalten",
    "cover.open_cover": "Öffnen",
    "cover.close_cover": "Schließen",
    "switch.turn_on": "Einschalten",
    "switch.turn_off": "Ausschalten",
    "valve.open_valve": "Öffnen",
    "valve.close_valve": "Schließen",
    "climate.set_temperature": "Zieltemperatur einstellen",
    "climate.set_temperature.temperature": "Temperatur",
    "notify.notify": "Benachrichtigung senden",
    "notify.notify.message": "Nachricht",
    "notify.notify.title": "Titel",
    "counter.increment": "Erhöhen",
    "input_select.select_option": "Auswählen",
    "input_select.select_option.option": "Option",
    "timer.start": "Starten",
    "alarm_control_panel.alarm_arm_away": "Abwesend scharf schalten",
    "scene.turn_on": "Aktivieren",
    "script.turn_on": "Einschalten",
  },
};

/** "light.turn_on.brightness_pct" → "component.light.services.turn_on.fields.brightness_pct.name". */
function toTranslationKeys(texts: Record<string, string>): HaTranslations {
  return Object.fromEntries(
    Object.entries(texts).map(([key, text]) => {
      const [domain, service, field] = key.split(".");
      const prefix = `component.${domain}.services.${service}`;

      return [field ? `${prefix}.fields.${field}.name` : `${prefix}.name`, text];
    }),
  );
}

function sensor(entityId: string, name: string, state: string, unit?: string): DemoEntity {
  return {
    entityId,
    name,
    state,
    platform: "demo",
    attributes: unit ? { unit_of_measurement: unit } : {},
  };
}

/** Devices the flows refer to. They are not listed themselves, but give the chips their names. */
const DEVICES: DemoEntity[] = [
  sensor("binary_sensor.terrace_motion", "Terrace motion", "off"),
  sensor("binary_sensor.front_door", "Front door", "off"),
  sensor("binary_sensor.anyone_home", "Anyone home", "on"),
  sensor("light.terrace", "Terrace light", "off"),
  sensor("light.garden_paths", "Garden path lights", "off"),
  sensor("light.living_room", "Living room light", "on"),
  sensor("cover.awning", "Awning", "open"),
  sensor("sensor.wind_speed", "Wind speed", "12", "km/h"),
  sensor("sensor.lawn_moisture", "Lawn moisture", "34", "%"),
  sensor("valve.lawn_irrigation", "Lawn irrigation", "closed"),
  sensor("sensor.solar_power", "Solar power", "3420", "W"),
  sensor("sensor.house_consumption", "House consumption", "1580", "W"),
  sensor("switch.wallbox", "Wallbox", "off"),
  sensor("sensor.washing_machine_power", "Washing machine power", "2", "W"),
  sensor("climate.bathroom", "Bathroom heating", "heat"),
  sensor("alarm_control_panel.home", "Alarm system", "disarmed"),
];

const AUTOMATIONS: DemoEntity[] = [
  {
    entityId: "automation.terrace_light_on_motion",
    name: "Terrace light on motion",
    state: "on",
    platform: "automation",
    uniqueId: "1718034411822",
    category: "House/Terrace",
    areaId: "terrace",
    labels: ["lights"],
    config: {
      id: "1718034411822",
      alias: "Terrace light on motion",
      description: "Turns the terrace light on at night when someone walks by.",
      mode: "restart",
      triggers: [{ trigger: "state", entity_id: "binary_sensor.terrace_motion", to: "on" }],
      conditions: [
        { condition: "sun", after: "sunset" },
        { condition: "state", entity_id: "light.terrace", state: "off" },
      ],
      actions: [
        {
          action: "light.turn_on",
          target: { entity_id: "light.terrace" },
          data: { brightness_pct: 70 },
        },
        { delay: duration(5) },
        { action: "light.turn_off", target: { entity_id: "light.terrace" } },
      ],
    },
  },
  {
    entityId: "automation.retract_awning_in_wind",
    name: "Retract awning in strong wind",
    state: "on",
    platform: "automation",
    uniqueId: "1718034529301",
    category: "House/Terrace",
    areaId: "terrace",
    labels: ["weather"],
    config: {
      id: "1718034529301",
      alias: "Retract awning in strong wind",
      description: "",
      mode: "single",
      triggers: [
        {
          trigger: "numeric_state",
          entity_id: "sensor.wind_speed",
          above: 40,
          for: duration(1),
        },
      ],
      conditions: [{ condition: "state", entity_id: "cover.awning", state: "open" }],
      actions: [
        { action: "cover.close_cover", target: { entity_id: "cover.awning" } },
        {
          action: "notify.notify",
          data: { message: "Awning retracted because of strong wind", title: "Terrace" },
        },
      ],
    },
  },
  {
    entityId: "automation.morning_garden_watering",
    name: "Morning garden watering",
    state: "on",
    platform: "automation",
    uniqueId: "1719211800442",
    category: "House/Garden",
    areaId: "garden",
    labels: ["water"],
    config: {
      id: "1719211800442",
      alias: "Morning garden watering",
      description: "Waters the lawn early, twice as long when the soil is dry.",
      mode: "single",
      triggers: [{ trigger: "time", at: "05:30:00" }],
      conditions: [],
      actions: [
        { action: "valve.open_valve", target: { entity_id: "valve.lawn_irrigation" } },
        {
          if: [{ condition: "numeric_state", entity_id: "sensor.lawn_moisture", below: 20 }],
          then: [{ delay: duration(30) }],
          else: [{ delay: duration(15) }],
        },
        { action: "valve.close_valve", target: { entity_id: "valve.lawn_irrigation" } },
      ],
    },
  },
  {
    entityId: "automation.front_door_left_open",
    name: "Front door left open",
    state: "on",
    platform: "automation",
    uniqueId: "1720004100918",
    category: "House/Entrance",
    areaId: "hallway",
    labels: ["security"],
    config: {
      id: "1720004100918",
      alias: "Front door left open",
      description: "",
      mode: "single",
      triggers: [
        { trigger: "state", entity_id: "binary_sensor.front_door", to: "on", for: duration(5) },
      ],
      conditions: [],
      actions: [
        {
          action: "notify.notify",
          data: { message: "The front door has been open for 5 minutes" },
        },
      ],
    },
  },
  {
    entityId: "automation.solar_surplus_to_wallbox",
    name: "Solar surplus into the wallbox",
    state: "on",
    platform: "automation",
    uniqueId: "1721300022100",
    category: "Energy/Solar",
    areaId: "garage",
    labels: ["energy"],
    config: {
      id: "1721300022100",
      alias: "Solar surplus into the wallbox",
      description: "Charges the car once more than 1.5 kW are left over for 10 minutes.",
      mode: "single",
      triggers: [
        {
          trigger: "numeric_state",
          entity_id: "sensor.solar_surplus",
          above: 1500,
          for: duration(10),
        },
      ],
      conditions: [{ condition: "state", entity_id: "switch.wallbox", state: "off" }],
      actions: [
        { action: "switch.turn_on", target: { entity_id: "switch.wallbox" } },
        { action: "counter.increment", target: { entity_id: "counter.solar_surplus_days" } },
      ],
    },
  },
  {
    entityId: "automation.washing_machine_done",
    name: "Washing machine done",
    state: "on",
    platform: "automation",
    uniqueId: "1722448800031",
    category: "Notifications",
    labels: ["comfort"],
    config: {
      id: "1722448800031",
      alias: "Washing machine done",
      description: "",
      mode: "single",
      triggers: [
        {
          trigger: "numeric_state",
          entity_id: "sensor.washing_machine_power",
          below: 5,
          for: duration(3),
        },
      ],
      conditions: [
        { condition: "state", entity_id: "input_select.washing_machine_status", state: "Running" },
      ],
      actions: [
        {
          action: "input_select.select_option",
          target: { entity_id: "input_select.washing_machine_status" },
          data: { option: "Done" },
        },
        { action: "notify.notify", data: { message: "The laundry is done" } },
      ],
    },
  },
  {
    entityId: "automation.preheat_bathroom",
    name: "Preheat the bathroom",
    state: "off",
    platform: "automation",
    uniqueId: "1709802012004",
    category: "Climate/Bathroom",
    areaId: "bathroom",
    labels: ["comfort"],
    config: {
      id: "1709802012004",
      alias: "Preheat the bathroom",
      description: "",
      mode: "single",
      triggers: [{ trigger: "time", at: "06:15:00" }],
      conditions: [
        { condition: "time", weekday: ["mon", "tue", "wed", "thu", "fri"] },
        { condition: "state", entity_id: "binary_sensor.anyone_home", state: "on" },
      ],
      actions: [
        {
          action: "climate.set_temperature",
          target: { entity_id: "climate.bathroom" },
          data: { temperature: 22 },
        },
      ],
    },
  },
  {
    entityId: "automation.arm_alarm_when_leaving",
    name: "Arm the alarm when everyone left",
    state: "on",
    platform: "automation",
    uniqueId: "1710240099876",
    category: "Security",
    labels: ["security"],
    config: {
      id: "1710240099876",
      alias: "Arm the alarm when everyone left",
      description: "",
      mode: "single",
      triggers: [
        {
          trigger: "state",
          entity_id: "binary_sensor.anyone_home",
          to: "off",
          for: duration(10),
        },
      ],
      conditions: [{ condition: "state", entity_id: "input_boolean.guest_mode", state: "off" }],
      actions: [
        { action: "scene.turn_on", target: { entity_id: "scene.nobody_home" } },
        {
          action: "alarm_control_panel.alarm_arm_away",
          target: { entity_id: "alarm_control_panel.home" },
        },
      ],
    },
  },
  {
    entityId: "automation.old_light_switch_test",
    name: "Old light switch test",
    state: "off",
    platform: "automation",
    uniqueId: "1702201100012",
    labels: [],
    config: {
      id: "1702201100012",
      alias: "Old light switch test",
      description: "",
      mode: "single",
      triggers: [{ trigger: "state", entity_id: "binary_sensor.front_door", to: "on" }],
      conditions: [],
      actions: [{ action: "light.turn_on", target: { entity_id: "light.terrace" } }],
    },
  },
];

const SCRIPTS: DemoEntity[] = [
  {
    entityId: "script.terrace_evening_mood",
    name: "Terrace evening mood",
    state: "off",
    platform: "script",
    uniqueId: "terrace_evening_mood",
    category: "House/Terrace",
    areaId: "terrace",
    labels: ["lights", "comfort"],
    config: {
      alias: "Terrace evening mood",
      description: "Warm light, garden paths on, awning out.",
      mode: "single",
      sequence: [
        {
          action: "light.turn_on",
          target: { entity_id: "light.terrace" },
          data: { brightness_pct: 40 },
        },
        { action: "light.turn_on", target: { entity_id: "light.garden_paths" } },
        { delay: duration(0, 2) },
        { action: "cover.open_cover", target: { entity_id: "cover.awning" } },
      ],
    },
  },
  {
    entityId: "script.all_off",
    name: "Everything off",
    state: "off",
    platform: "script",
    uniqueId: "all_off",
    category: "House",
    labels: ["lights"],
    config: {
      alias: "Everything off",
      mode: "single",
      sequence: [
        { action: "light.turn_off", target: { entity_id: "light.terrace" } },
        { action: "light.turn_off", target: { entity_id: "light.garden_paths" } },
        { action: "light.turn_off", target: { entity_id: "light.living_room" } },
      ],
    },
  },
  {
    entityId: "script.good_night",
    name: "Good night",
    state: "off",
    platform: "script",
    uniqueId: "good_night",
    category: "Routines",
    labels: ["comfort"],
    config: {
      alias: "Good night",
      mode: "single",
      sequence: [
        { action: "script.turn_on", target: { entity_id: "script.all_off" } },
        {
          if: [{ condition: "state", entity_id: "input_boolean.guest_mode", state: "off" }],
          then: [
            {
              action: "alarm_control_panel.alarm_arm_away",
              target: { entity_id: "alarm_control_panel.home" },
            },
          ],
          else: [
            { action: "notify.notify", data: { message: "Guest mode is on, alarm stays off" } },
          ],
        },
      ],
    },
  },
];

const SCENES: DemoEntity[] = [
  {
    entityId: "scene.terrace_barbecue",
    name: "Terrace barbecue",
    state: "2026-11-18T19:02:11+00:00",
    platform: "homeassistant",
    uniqueId: "1723912200457",
    category: "House/Terrace",
    areaId: "terrace",
    labels: ["lights"],
  },
  {
    entityId: "scene.nobody_home",
    name: "Nobody home",
    state: "2026-11-20T08:12:40+00:00",
    platform: "homeassistant",
    uniqueId: "1723912288101",
    category: "Security",
    labels: ["security"],
  },
  {
    entityId: "scene.cozy_evening",
    name: "Cozy evening",
    state: "2026-11-19T18:30:05+00:00",
    platform: "homeassistant",
    uniqueId: "1723912301777",
    category: "House",
    areaId: "living_room",
    labels: ["lights", "comfort"],
  },
];

const HELPERS: DemoEntity[] = [
  {
    entityId: "input_number.terrace_brightness",
    name: "Terrace brightness at night",
    state: "70",
    platform: "input_number",
    uniqueId: "terrace_brightness",
    category: "House/Terrace",
    areaId: "terrace",
    labels: ["lights"],
    attributes: { min: 10, max: 100, step: 5, unit_of_measurement: "%" },
  },
  {
    entityId: "input_boolean.guest_mode",
    name: "Guest mode",
    state: "off",
    platform: "input_boolean",
    uniqueId: "guest_mode",
    category: "House",
    labels: ["comfort"],
  },
  {
    entityId: "timer.terrace_light_delay",
    name: "Terrace light delay",
    state: "idle",
    platform: "timer",
    uniqueId: "terrace_light_delay",
    category: "House/Terrace",
    areaId: "terrace",
    labels: ["lights"],
  },
  {
    entityId: "input_select.washing_machine_status",
    name: "Washing machine status",
    state: "Off",
    platform: "input_select",
    uniqueId: "washing_machine_status",
    category: "Notifications",
    labels: ["comfort"],
    attributes: { options: ["Off", "Running", "Done"] },
  },
  {
    entityId: "counter.solar_surplus_days",
    name: "Days with solar surplus",
    state: "23",
    platform: "counter",
    uniqueId: "solar_surplus_days",
    category: "Energy/Solar",
    labels: ["energy"],
  },
  {
    entityId: "input_button.reset_alarm",
    name: "Reset alarm",
    state: "2026-11-12T21:04:00+00:00",
    platform: "input_button",
    uniqueId: "reset_alarm",
    category: "Security",
    labels: ["security"],
  },
  {
    entityId: "sensor.solar_surplus",
    name: "Solar surplus",
    state: "1840",
    platform: "template",
    uniqueId: "demo_solar_surplus",
    configEntryId: "demo_template_solar_surplus",
    category: "Energy/Solar",
    labels: ["energy"],
    attributes: { unit_of_measurement: "W" },
  },
];

/**
 * An invented home for demo mode: a few rooms, nested folders, flows with all common block types.
 * No real data; safe for screenshots in the public repo.
 */
export function createDemoHome(): DemoHome {
  return {
    areas: [
      { area_id: "living_room", name: "Living room", icon: null },
      { area_id: "terrace", name: "Terrace", icon: null },
      { area_id: "garden", name: "Garden", icon: null },
      { area_id: "hallway", name: "Hallway", icon: null },
      { area_id: "bathroom", name: "Bathroom", icon: null },
      { area_id: "garage", name: "Garage", icon: null },
    ],
    labels: [
      { label_id: "lights", name: "Lights", icon: null, color: "amber" },
      { label_id: "weather", name: "Weather", icon: null, color: "light-blue" },
      { label_id: "water", name: "Water", icon: null, color: "blue" },
      { label_id: "energy", name: "Energy", icon: null, color: "green" },
      { label_id: "security", name: "Security", icon: null, color: "red" },
      { label_id: "comfort", name: "Comfort", icon: null, color: "teal" },
    ],
    entities: structuredClone([...DEVICES, ...AUTOMATIONS, ...SCRIPTS, ...SCENES, ...HELPERS]),
    helperConfigEntries: [
      { entry_id: "demo_template_solar_surplus", domain: "template", title: "Solar surplus" },
    ],
    services: structuredClone(SERVICES),
    translations: Object.fromEntries(
      Object.entries(SERVICE_TEXTS).map(([language, texts]) => [
        language,
        { services: toTranslationKeys(texts), triggers: {}, conditions: {} },
      ]),
    ),
    overlay: {
      folderColors: {
        House: "#c9862f",
        "House/Garden": "#76a43a",
        Energy: "#2f9b68",
        Climate: "#3a80c2",
        Security: "#c64a4a",
        Notifications: "#8a63d2",
        Routines: "#d0659b",
      },
      favorites: ["automation.terrace_light_on_motion", "script.good_night"],
      notes: {
        "automation.terrace_light_on_motion":
          "Brightness could come from the helper. In summer maybe only after 9 pm.",
      },
    },
  };
}
