import type { HaConnectionService } from "../ha/ha-connection.service";
import { LookupsController } from "./lookups.controller";

describe("LookupsController", () => {
  it("maps areas and labels to camelCase and sorts them by name", async () => {
    const call = jest.fn((type: string) =>
      Promise.resolve(
        type === "config/area_registry/list"
          ? [
              { area_id: "terrasse", name: "Terrasse", icon: null },
              { area_id: "bad", name: "bad", icon: "mdi:shower" },
            ]
          : [{ label_id: "licht", name: "Licht", icon: null, color: "amber" }],
      ),
    );
    const controller = new LookupsController({ call } as unknown as HaConnectionService);

    await expect(controller.areas()).resolves.toEqual([
      { areaId: "bad", name: "bad", icon: "mdi:shower" },
      { areaId: "terrasse", name: "Terrasse", icon: null },
    ]);
    await expect(controller.labels()).resolves.toEqual([
      { labelId: "licht", name: "Licht", icon: null, color: "amber" },
    ]);
  });

  it("lists entities with name, domain, state and select options", async () => {
    const call = jest.fn().mockResolvedValue([
      {
        entity_id: "input_select.modus",
        state: "Tag",
        attributes: { friendly_name: "Modus", options: ["Tag", "Nacht"] },
      },
      { entity_id: "light.flur", state: "on", attributes: { options: [1, 2] } },
    ]);
    const controller = new LookupsController({ call } as unknown as HaConnectionService);

    await expect(controller.entities()).resolves.toEqual([
      { entityId: "light.flur", name: "light.flur", domain: "light", state: "on", options: null },
      {
        entityId: "input_select.modus",
        name: "Modus",
        domain: "input_select",
        state: "Tag",
        options: ["Tag", "Nacht"],
      },
    ]);
  });
});
