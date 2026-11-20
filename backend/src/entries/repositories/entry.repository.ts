import type { Entry, EntryChanges } from "../entry.model";

export interface EntryRepository {
  findAll(): Promise<Entry[]>;
  findOne(entityId: string): Promise<Entry | null>;
  /** Writes name, icon, area and labels to HA's entity registry; missing fields stay. */
  update(entityId: string, changes: EntryChanges): Promise<void>;
  /** Calls an HA service for one entity, e.g. `automation.turn_off`. */
  callService(domain: string, service: string, entityId: string): Promise<void>;
}
