import { ConflictException, NotFoundException } from "@nestjs/common";

import { EMPTY_OVERLAY, type Overlay } from "../overlay/overlay.model";
import type { OverlayRepository } from "../overlay/repositories/overlay.repository";
import { FoldersService } from "./folders.service";

class FakeOverlay implements OverlayRepository {
  data: Overlay = structuredClone(EMPTY_OVERLAY);
  read = () => Promise.resolve(structuredClone(this.data));
  update = (change: (overlay: Overlay) => Overlay) => {
    this.data = change(structuredClone(this.data));
    return Promise.resolve(this.data);
  };
}

describe("FoldersService", () => {
  let overlay: FakeOverlay;
  let service: FoldersService;

  beforeEach(() => {
    overlay = new FakeOverlay();
    service = new FoldersService(overlay);
  });

  it("stores a normalized folder and lists folders sorted", async () => {
    await service.create(" Haus / Pool ");
    await service.create("Garage");

    const overview = await service.findAll();
    expect(overview.saved).toEqual(["Garage", "Haus/Pool"]);
  });

  it("sets and removes a folder color, and drops it when the folder is deleted", async () => {
    await service.create("Haus/Pool");
    await service.setColor("Haus/Pool", "#e3a64e");
    await service.setColor("Garage", "#2f9b68");
    await service.setColor("Garage", null);

    expect(overlay.data.folderColors).toEqual({ "Haus/Pool": "#e3a64e" });

    await service.delete("Haus/Pool");
    expect(overlay.data.folderColors).toEqual({});
  });

  it("refuses the same folder twice", async () => {
    await service.create("Haus/Pool");

    await expect(service.create("Haus/Pool")).rejects.toBeInstanceOf(ConflictException);
  });

  it("deletes a folder and reports unknown ones", async () => {
    await service.create("Haus/Pool");
    await service.delete("Haus/Pool");

    expect(overlay.data.folders).toEqual([]);
    await expect(service.delete("Haus/Pool")).rejects.toBeInstanceOf(NotFoundException);
  });
});
