import { CategoriesService } from "../categories/categories.service";
import { HaCategoriesRepository } from "../categories/repositories/ha-categories.repository";
import { createDemoHome } from "../demo/demo-home";
import { DemoHaConnectionService, DemoHaRestService } from "../demo/demo-ha.services";
import { FakeHa } from "../demo/fake-ha";
import { MemoryOverlayRepository } from "../demo/memory-overlay.repository";
import { DependenciesService } from "../dependencies/dependencies.service";
import { HaEditorRepository } from "../editor/repositories/ha-editor.repository";
import { EntriesService } from "../entries/entries.service";
import { HaEntriesRepository } from "../entries/repositories/ha-entries.repository";
import { LiveService } from "../live/live.service";
import { HomeSnapshotService } from "../snapshot/home-snapshot.service";
import { EntryAreasService } from "./entry-areas.service";

/** Areas in the demo home, through the real services. */
async function areasOf(): Promise<Map<string, string[]>> {
  const fake = new FakeHa(createDemoHome());
  const ha = new DemoHaConnectionService(fake);
  const overlay = new MemoryOverlayRepository({});
  const categories = new CategoriesService(new HaCategoriesRepository(ha), overlay);
  const entries = new EntriesService(new HaEntriesRepository(ha), overlay, categories);
  const editor = new HaEditorRepository(ha, new DemoHaRestService(fake));
  const snapshots = new HomeSnapshotService(entries, ha, editor, () => 0, new LiveService(ha));

  const all = await new EntryAreasService(snapshots, new DependenciesService(snapshots)).findAll();

  return new Map(
    all.map((entry) => [
      entry.entityId,
      entry.areas.map((area) =>
        [area.name, area.source, area.via?.name].filter(Boolean).join(" / "),
      ),
    ]),
  );
}

describe("EntryAreasService", () => {
  it("keeps the own area and derives nothing more", async () => {
    expect((await areasOf()).get("automation.terrace_light_on_motion")).toEqual(["Terrace / own"]);
  });

  it("takes the areas of the devices a flow uses, with the device as reason", async () => {
    const areas = await areasOf();

    expect(areas.get("automation.arm_alarm_when_leaving")).toEqual([
      "Hallway / uses / Alarm panel",
    ]);
    expect(areas.get("script.all_off")).toEqual([
      "Garden / uses / Garden path lights",
      "Living room / uses / Ceiling light",
      "Terrace / uses / Terrace light",
    ]);
  });

  it("gives helpers the areas of the flows that use them", async () => {
    expect((await areasOf()).get("input_boolean.guest_mode")).toEqual([
      "Hallway / usedBy / Arm the alarm when everyone left",
    ]);
  });

  it("leaves entries without any area empty", async () => {
    const areas = await areasOf();

    expect(areas.get("input_button.reset_alarm")).toEqual([]);
    expect(areas.get("automation.washing_machine_done")).toEqual([]);
  });
});
