import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";

import type { CategoriesService } from "../categories/categories.service";
import { EMPTY_OVERLAY, type Overlay } from "../overlay/overlay.model";
import { HelpersService } from "./helpers.service";
import type { HelperRegistration, HelperRepository } from "./repositories/helper.repository";

function setup(
  entityIdAfterAttempts: number | null,
  registration: HelperRegistration | null = null,
) {
  let lookups = 0;
  const create = jest.fn().mockResolvedValue("gaestemodus");
  const remove = jest.fn().mockResolvedValue(undefined);
  const helpers: HelperRepository = {
    create,
    remove,
    findRegistration: jest.fn().mockResolvedValue(registration),
    findEntityId: jest.fn(() => {
      lookups++;
      const isRegistered = entityIdAfterAttempts !== null && lookups >= entityIdAfterAttempts;
      return Promise.resolve(isRegistered ? "input_boolean.gaestemodus" : null);
    }),
  };
  const assign = jest.fn().mockResolvedValue(undefined);
  const cleanUp = jest.fn().mockResolvedValue(undefined);
  const categories = { assign, cleanUp } as unknown as CategoriesService;
  const overlay = {
    data: { ...structuredClone(EMPTY_OVERLAY), favorites: ["input_boolean.gaestemodus"] },
    read: () => Promise.resolve(structuredClone(overlay.data)),
    update: (change: (current: Overlay) => Overlay) => {
      overlay.data = change(structuredClone(overlay.data));
      return Promise.resolve(overlay.data);
    },
  };
  const noWait = () => Promise.resolve();
  const service = new HelpersService(helpers, categories, overlay, noWait);

  return { service, create, remove, assign, cleanUp, overlay };
}

describe("HelpersService", () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  it("creates the helper, waits for its entity and sorts it into the folder", async () => {
    const { service, create, assign } = setup(3);

    const result = await service.create({
      type: "input_boolean",
      name: " Gästemodus ",
      categoryPath: "Haus",
    });

    expect(result).toEqual({ entityId: "input_boolean.gaestemodus" });
    expect(create).toHaveBeenCalledWith("input_boolean", { name: "Gästemodus" });
    expect(assign).toHaveBeenCalledWith({
      entityId: "input_boolean.gaestemodus",
      scope: "helpers",
      currentCategoryId: null,
      targetPath: "Haus",
    });
  });

  it("skips the folder when none is given", async () => {
    const { service, assign } = setup(1);

    await service.create({ type: "input_button", name: "Klingel" });

    expect(assign).not.toHaveBeenCalled();
  });

  it("falls back to the usual entity ID scheme when the entity never shows up", async () => {
    const { service, assign } = setup(null);

    const result = await service.create({ type: "input_boolean", name: "X", categoryPath: "Haus" });

    expect(result).toEqual({ entityId: "input_boolean.gaestemodus" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("rejects invalid settings before anything is created in HA", async () => {
    const { service, create } = setup(1);
    const dto = { type: "input_number" as const, name: "X", settings: { min: 5, max: 1 } };

    await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it("deletes a storage helper, its extras and its emptied category", async () => {
    const registration = {
      platform: "input_boolean",
      uniqueId: "gaestemodus",
      categoryId: "cat-1",
    };
    const { service, remove, cleanUp, overlay } = setup(1, registration);

    await service.delete("input_boolean.gaestemodus");

    expect(remove).toHaveBeenCalledWith("input_boolean", "gaestemodus");
    expect(cleanUp).toHaveBeenCalledWith("helpers", "cat-1");
    expect(overlay.data.favorites).toEqual([]);
  });

  it("refuses to delete config-entry helpers and unknown entities", async () => {
    const template = { platform: "template", uniqueId: "abc", categoryId: null };
    const { service: templateService, remove } = setup(1, template);
    const { service: unknownService } = setup(1, null);

    await expect(templateService.delete("sensor.pv")).rejects.toBeInstanceOf(BadRequestException);
    await expect(unknownService.delete("input_boolean.nope")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(remove).not.toHaveBeenCalled();
  });
});
