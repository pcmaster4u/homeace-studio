import { Controller, Get, Param } from "@nestjs/common";

import { DependenciesService, type Dependencies } from "./dependencies.service";

/** What an entry uses and who uses it (docs/api.md). */
@Controller("dependencies")
export class DependenciesController {
  constructor(private readonly dependencies: DependenciesService) {}

  @Get(":entityId")
  forEntity(@Param("entityId") entityId: string): Promise<Dependencies> {
    return this.dependencies.forEntity(entityId);
  }
}
