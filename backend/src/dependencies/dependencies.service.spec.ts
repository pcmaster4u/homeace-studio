import { CategoriesService } from "../categories/categories.service";
import { HaCategoriesRepository } from "../categories/repositories/ha-categories.repository";
import { createDemoHome } from "../demo/demo-home";
import { DemoHaConnectionService, DemoHaRestService } from "../demo/demo-ha.services";
import { FakeHa } from "../demo/fake-ha";
import { MemoryOverlayRepository } from "../demo/memory-overlay.repository";
import { HaEditorRepository } from "../editor/repositories/ha-editor.repository";
import { EntriesService } from "../entries/entries.service";
import { HaEntriesRepository } from "../entries/repositories/ha-entries.repository";
import { LiveService } from "../live/live.service";
import { HomeSnapshotService } from "../snapshot/home-snapshot.service";
import { DependenciesService } from "./dependencies.service";

/** Dependencies in the demo home, through the real services. */
function setup() {
  const fake = new FakeHa(createDemoHome());
  const ha = new DemoHaConnectionService(fake);
  const overlay = new MemoryOverlayRepository({});
  const categories = new CategoriesService(new HaCategoriesRepository(ha), overlay);
  const entries = new EntriesService(new HaEntriesRepository(ha), overlay, categories);
  const editor = new HaEditorRepository(ha, new DemoHaRestService(fake));
  const snapshots = new HomeSnapshotService(entries, ha, editor, () => 0, new LiveService(ha));

  return new DependenciesService(snapshots);
}

describe("DependenciesService", () => {
  it("lists what an automation uses, with roles and who else uses it", async () => {
    const result = await setup().forEntity("automation.terrace_light_on_motion");
    const byId = Object.fromEntries(result.uses.map((use) => [use.entityId, use]));

    expect(byId["binary_sensor.terrace_motion"]?.roles).toEqual(["trigger"]);
    expect(byId["light.terrace"]?.roles).toEqual(["condition", "action"]);
    expect(byId["light.terrace"]?.exists).toBe(true);
    expect(byId["light.terrace"]?.alsoUsedBy.map((user) => user.entityId)).toEqual(
      expect.arrayContaining(["script.terrace_evening_mood", "scene.terrace_barbecue"]),
    );
    expect(result.usedBy).toEqual([]);
  });

  it("shows who uses a helper, also through a template", async () => {
    const result = await setup().forEntity("input_number.terrace_brightness");

    expect(result.uses).toEqual([]);
    expect(result.usedBy).toEqual([
      { entityId: "script.terrace_evening_mood", name: "Terrace evening mood", roles: ["value"] },
    ]);
  });

  it("marks entities that no longer exist", async () => {
    const result = await setup().forEntity("automation.hallway_light_at_night");
    const gone = result.uses.filter((use) => !use.exists).map((use) => use.entityId);

    expect(gone.sort()).toEqual(["binary_sensor.hallway_motion", "light.hallway_ceiling_old"]);
  });

  it("knows which scripts call another one", async () => {
    const result = await setup().forEntity("script.all_off");

    expect(result.usedBy.map((user) => [user.entityId, user.roles])).toContainEqual([
      "script.good_night",
      ["call"],
    ]);
  });
});
