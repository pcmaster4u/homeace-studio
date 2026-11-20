import { Injectable } from "@nestjs/common";

import { CATEGORY_SCOPES, type CategoryScope } from "../../categories/categories.constants";
import { HaConnectionService } from "../../ha/ha-connection.service";
import { HA_COMMAND, HA_CONFIG_ENTRY_TYPE } from "../../ha/ha.constants";
import type {
  HaArea,
  HaCategory,
  HaConfigEntry,
  HaEntityRegistryEntry,
  HaLabel,
  HaState,
} from "../../ha/ha.types";
import { mapToEntries } from "../entry.mapper";
import type { Entry, EntryChanges } from "../entry.model";
import type { EntryRepository } from "./entry.repository";

/** Reads entries straight from HA on every call; a cache follows once live updates exist. */
@Injectable()
export class HaEntriesRepository implements EntryRepository {
  constructor(private readonly ha: HaConnectionService) {}

  async findAll(): Promise<Entry[]> {
    const helperFilter = { type_filter: [HA_CONFIG_ENTRY_TYPE.helper] };

    const [registryEntries, states, helperConfigEntries, categoriesByScope, labels, areas] =
      await Promise.all([
        this.ha.call<HaEntityRegistryEntry[]>(HA_COMMAND.entityRegistryList),
        this.ha.call<HaState[]>(HA_COMMAND.getStates),
        this.ha.call<HaConfigEntry[]>(HA_COMMAND.configEntriesGet, helperFilter),
        this.loadCategoriesByScope(),
        this.ha.call<HaLabel[]>(HA_COMMAND.labelRegistryList),
        this.ha.call<HaArea[]>(HA_COMMAND.areaRegistryList),
      ]);

    const helperConfigEntryIds = new Set(helperConfigEntries.map((entry) => entry.entry_id));

    return mapToEntries({
      registryEntries,
      states,
      helperConfigEntryIds,
      categoriesByScope,
      labels,
      areas,
    });
  }

  async findOne(entityId: string): Promise<Entry | null> {
    const entries = await this.findAll();

    return entries.find((entry) => entry.entityId === entityId) ?? null;
  }

  async update(entityId: string, changes: EntryChanges): Promise<void> {
    // Only fields that are set go to HA; undefined means "leave as it is".
    const fields = {
      name: changes.name,
      icon: changes.icon,
      area_id: changes.areaId,
      labels: changes.labelIds,
    };
    const definedFields = Object.entries(fields).filter(([, value]) => value !== undefined);

    await this.ha.call(HA_COMMAND.entityRegistryUpdate, {
      entity_id: entityId,
      ...Object.fromEntries(definedFields),
    });
  }

  async callService(domain: string, service: string, entityId: string): Promise<void> {
    await this.ha.call(HA_COMMAND.callService, {
      domain,
      service,
      target: { entity_id: entityId },
    });
  }

  private async loadCategoriesByScope(): Promise<Record<CategoryScope, HaCategory[]>> {
    const categoryLists = await Promise.all(
      CATEGORY_SCOPES.map((scope) =>
        this.ha.call<HaCategory[]>(HA_COMMAND.categoryRegistryList, { scope }),
      ),
    );
    const pairs = CATEGORY_SCOPES.map((scope, index) => [scope, categoryLists[index]]);

    return Object.fromEntries(pairs) as Record<CategoryScope, HaCategory[]>;
  }
}
