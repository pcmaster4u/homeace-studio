import { EntriesController } from "./entries.controller";
import type { EntriesService } from "./entries.service";

describe("EntriesController", () => {
  it("returns the entries from the service", async () => {
    const entries = [{ entityId: "scene.kino" }];
    const service = { findAll: jest.fn().mockResolvedValue(entries) } as unknown as EntriesService;
    const controller = new EntriesController(service);

    await expect(controller.findAll()).resolves.toBe(entries);
  });
});
