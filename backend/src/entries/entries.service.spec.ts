import { BadRequestException, NotFoundException } from "@nestjs/common";

import type { CategoriesService } from "../categories/categories.service";
import { EMPTY_OVERLAY, type Overlay } from "../overlay/overlay.model";
import { EntriesService } from "./entries.service";
import type { Entry } from "./entry.model";
import type { EntryRepository } from "./repositories/entry.repository";

function entry(overrides: Partial<Entry>): Entry {
  return {
    entityId: "script.example",
    kind: "script",
    domain: "script",
    name: "Example",
    icon: null,
    categoryId: null,
    categoryPath: null,
    labels: [],
    area: null,
    state: "off",
    isDisabled: false,
    isHidden: false,
    isInRegistry: true,
    isFavorite: false,
    note: null,
    ...overrides,
  };
}

function setup(entries: Entry[], overlayData: Overlay = structuredClone(EMPTY_OVERLAY)) {
  const update = jest.fn().mockResolvedValue(undefined);
  const callService = jest.fn().mockResolvedValue(undefined);
  const repository: EntryRepository = {
    findAll: jest.fn().mockResolvedValue(entries),
    findOne: jest.fn((entityId: string) =>
      Promise.resolve(entries.find((item) => item.entityId === entityId) ?? null),
    ),
    update,
    callService,
  };
  const overlay = {
    data: overlayData,
    read: () => Promise.resolve(structuredClone(overlay.data)),
    update: (change: (current: Overlay) => Overlay) => {
      overlay.data = change(structuredClone(overlay.data));
      return Promise.resolve(overlay.data);
    },
  };
  const assign = jest.fn().mockResolvedValue(undefined);
  const categories = { assign } as unknown as CategoriesService;
  const service = new EntriesService(repository, overlay, categories);

  return { service, assign, update, callService, overlay };
}

describe("EntriesService", () => {
  it("returns all entries with extras, sorted by name, ignoring case", async () => {
    const { service } = setup(
      [entry({ name: "gute Nacht", entityId: "script.a" }), entry({ name: "Alles aus" })],
      { ...EMPTY_OVERLAY, favorites: ["script.a"] },
    );

    const entries = await service.findAll();

    expect(entries.map((item) => [item.name, item.isFavorite])).toEqual([
      ["Alles aus", false],
      ["gute Nacht", true],
    ]);
  });

  it("moves an entry using the category scope of its kind", async () => {
    const { service, assign } = setup([
      entry({ entityId: "input_boolean.gaeste", kind: "helper", categoryId: "cat-1" }),
    ]);

    await service.moveToCategory("input_boolean.gaeste", "Haus/Pool");

    expect(assign).toHaveBeenCalledWith({
      entityId: "input_boolean.gaeste",
      scope: "helpers",
      currentCategoryId: "cat-1",
      targetPath: "Haus/Pool",
    });
  });

  it("throws NotFoundException for an unknown entity", async () => {
    const { service } = setup([]);

    await expect(service.moveToCategory("script.nope", null)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("refuses to change YAML entities without registry entry", async () => {
    const { service, assign, update } = setup([
      entry({ entityId: "script.yaml", isInRegistry: false }),
    ]);

    await expect(service.moveToCategory("script.yaml", "Haus")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.update("script.yaml", { name: "X" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(assign).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("sends a blank name and icon as null, so HA goes back to its defaults", async () => {
    const { service, update } = setup([entry({})]);

    await service.update("script.example", { name: "  ", icon: "", labelIds: ["licht"] });

    expect(update).toHaveBeenCalledWith("script.example", {
      name: null,
      icon: null,
      labelIds: ["licht"],
    });
  });

  it("maps actions to the service of the domain", async () => {
    const { service, callService } = setup([
      entry({ entityId: "automation.licht", domain: "automation", kind: "automation" }),
      entry({ entityId: "input_button.klingel", domain: "input_button", kind: "helper" }),
    ]);

    await service.runAction("automation.licht", "turnOff");
    await service.runAction("input_button.klingel", "run");

    expect(callService).toHaveBeenNthCalledWith(1, "automation", "turn_off", "automation.licht");
    expect(callService).toHaveBeenNthCalledWith(2, "input_button", "press", "input_button.klingel");
  });

  it("rejects actions the domain does not have", async () => {
    const { service, callService } = setup([entry({ entityId: "scene.kino", domain: "scene" })]);

    await expect(service.runAction("scene.kino", "turnOff")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(callService).not.toHaveBeenCalled();
  });

  it("stores favorite and note in the overlay", async () => {
    const { service, overlay } = setup([entry({})]);

    await service.updateExtras("script.example", { isFavorite: true, note: "Wichtig" });

    expect(overlay.data).toMatchObject({
      favorites: ["script.example"],
      notes: { "script.example": "Wichtig" },
    });
  });
});
