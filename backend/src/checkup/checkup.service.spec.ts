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
import { CheckupService } from "./checkup.service";

/** The check-up over the demo home, through the real services. */
function setup() {
  const fake = new FakeHa(createDemoHome());
  const ha = new DemoHaConnectionService(fake);
  const overlay = new MemoryOverlayRepository({});
  const categories = new CategoriesService(new HaCategoriesRepository(ha), overlay);
  const entries = new EntriesService(new HaEntriesRepository(ha), overlay, categories);
  const editor = new HaEditorRepository(ha, new DemoHaRestService(fake));
  let time = Date.parse("2026-11-20T12:00:00Z");
  const snapshots = new HomeSnapshotService(entries, ha, editor, () => time, new LiveService(ha));
  const service = new CheckupService(snapshots, overlay);

  return { service, advance: (ms: number) => (time += ms) };
}

describe("CheckupService", () => {
  it("finds what the demo home has wrong", async () => {
    const { service } = setup();

    const { findings } = await service.overview();
    const keys = findings.map((finding) => finding.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        "gone:automation.hallway_light_at_night",
        "unavailable:automation.washing_machine_done",
        "unused:input_number.office_target_temperature",
        "stale:automation.preheat_bathroom",
        "stale:automation.old_light_switch_test",
      ]),
    );
    expect(keys).not.toContain("unused:input_boolean.guest_mode");
    expect(keys).not.toContain("stale:automation.terrace_light_on_motion");

    const gone = findings.find((finding) => finding.kind === "gone");
    expect(gone?.refs.map((ref) => ref.entityId).sort()).toEqual([
      "binary_sensor.hallway_motion",
      "light.hallway_ceiling_old",
    ]);
  });

  it("hides ignored findings and shows them again on request", async () => {
    const { service } = setup();
    const key = "unused:input_number.office_target_temperature";

    await service.ignore(key);
    const hidden = await service.overview();
    expect(hidden.findings.map((finding) => finding.key)).not.toContain(key);
    expect(hidden.ignoredCount).toBe(1);

    await service.restoreIgnored();
    expect((await service.overview()).findings.map((finding) => finding.key)).toContain(key);
  });
});
