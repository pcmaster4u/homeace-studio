import { Controller, Get } from "@nestjs/common";

import { HaConnectionService } from "../ha/ha-connection.service";
import { HA_COMMAND } from "../ha/ha.constants";
import type { HaArea, HaLabel, HaState } from "../ha/ha.types";

export type Area = { areaId: string; name: string; icon: string | null };
export type Label = { labelId: string; name: string; icon: string | null; color: string | null };

export type EntityOption = {
  entityId: string;
  name: string;
  domain: string;
  /** Current state, offered as a suggestion when a block asks for a state. */
  state: string;
  /** The possible states of select-like entities (input_select, select, enum sensors). */
  options: string[] | null;
};

const DOMAIN_SEPARATOR = ".";

const byName = (first: { name: string }, second: { name: string }): number =>
  first.name.localeCompare(second.name, undefined, { sensitivity: "base" });

const stringList = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;

/**
 * HA's areas, labels and entities, for the pickers in the detail view and the flow editor. Read-only and a plain mapping, so the
 * controller talks to the HA connection directly instead of going through a service.
 */
@Controller()
export class LookupsController {
  constructor(private readonly ha: HaConnectionService) {}

  @Get("areas")
  async areas(): Promise<Area[]> {
    const areas = await this.ha.call<HaArea[]>(HA_COMMAND.areaRegistryList);
    const mapped = areas.map((area) => ({
      areaId: area.area_id,
      name: area.name,
      icon: area.icon,
    }));

    return mapped.sort(byName);
  }

  /** Every entity HA has right now, for the entity picker of the flow editor. */
  @Get("entities")
  async entities(): Promise<EntityOption[]> {
    const states = await this.ha.call<HaState[]>(HA_COMMAND.getStates);
    const mapped = states.map((state) => ({
      entityId: state.entity_id,
      name: state.attributes.friendly_name ?? state.entity_id,
      domain: state.entity_id.split(DOMAIN_SEPARATOR)[0] ?? "",
      state: state.state,
      options: stringList(state.attributes.options),
    }));

    return mapped.sort(byName);
  }

  @Get("labels")
  async labels(): Promise<Label[]> {
    const labels = await this.ha.call<HaLabel[]>(HA_COMMAND.labelRegistryList);
    const mapped = labels.map((label) => ({
      labelId: label.label_id,
      name: label.name,
      icon: label.icon,
      color: label.color,
    }));

    return mapped.sort(byName);
  }
}
