import { createDemoHome } from "../../demo/demo-home";
import { DemoHaConnectionService } from "../../demo/demo-ha.services";
import { FakeHa } from "../../demo/fake-ha";
import { HaEntriesRepository } from "./ha-entries.repository";

/** The registry fields of the properties form, against the demo home. */
function setup() {
  return new HaEntriesRepository(new DemoHaConnectionService(new FakeHa(createDemoHome())));
}

describe("HaEntriesRepository", () => {
  it("writes aliases and reads them back from entity_registry/get", async () => {
    const repository = setup();

    await repository.update("input_boolean.guest_mode", { aliases: ["Visitors", "Party"] });

    expect(await repository.findDetails("input_boolean.guest_mode")).toEqual({
      aliases: ["Visitors", "Party"],
    });
  });

  it("keeps HA's null for the entity's own name and never shows it", async () => {
    const ha = new DemoHaConnectionService(new FakeHa(createDemoHome()));
    const repository = new HaEntriesRepository(ha);

    expect(await repository.findDetails("input_boolean.guest_mode")).toEqual({ aliases: [] });

    await repository.update("input_boolean.guest_mode", { aliases: ["Visitors"] });
    const raw = await ha.call<{ aliases: unknown[] }>("config/entity_registry/get", {
      entity_id: "input_boolean.guest_mode",
    });
    expect(raw.aliases).toEqual([null, "Visitors"]);
  });

  it("hides and disables as the user; a disabled entity loses its state until enabled", async () => {
    const repository = setup();

    await repository.update("input_boolean.guest_mode", { isHidden: true, isDisabled: true });
    expect(await repository.findOne("input_boolean.guest_mode")).toMatchObject({
      isHidden: true,
      isDisabled: true,
      state: null,
    });

    await repository.update("input_boolean.guest_mode", { isDisabled: false });
    expect(await repository.findOne("input_boolean.guest_mode")).toMatchObject({
      isHidden: true,
      isDisabled: false,
      state: "off",
    });
  });
});
