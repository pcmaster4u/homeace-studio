import { Injectable } from "@nestjs/common";

import { DependenciesService } from "../dependencies/dependencies.service";
import { HomeSnapshotService, type HomeSnapshot } from "../snapshot/home-snapshot.service";
import { deriveEntryAreas, type EntryAreas } from "./entry-areas";

/** The areas of every entry, own or derived (docs/api.md). */
@Injectable()
export class EntryAreasService {
  private derived: { snapshot: HomeSnapshot; areas: EntryAreas[] } | null = null;

  constructor(
    private readonly snapshots: HomeSnapshotService,
    private readonly dependencies: DependenciesService,
  ) {}

  async findAll(): Promise<EntryAreas[]> {
    const snapshot = await this.snapshots.get();
    if (this.derived?.snapshot === snapshot) return this.derived.areas;

    const areas = deriveEntryAreas({ ...snapshot, index: this.dependencies.indexOf(snapshot) });
    this.derived = { snapshot, areas };
    return areas;
  }
}
