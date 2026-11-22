import { CategoriesService } from "../categories/categories.service";
import { HaCategoriesRepository } from "../categories/repositories/ha-categories.repository";
import { createDemoHome } from "../demo/demo-home";
import { DemoHaConnectionService, DemoHaRestService } from "../demo/demo-ha.services";
import { FakeHa } from "../demo/fake-ha";
import { MemoryOverlayRepository } from "../demo/memory-overlay.repository";
import { EditorService } from "../editor/editor.service";
import { FlowsService } from "../editor/flows.service";
import { HaEditorRepository } from "../editor/repositories/ha-editor.repository";
import { EntriesService } from "../entries/entries.service";
import { HaEntriesRepository } from "../entries/repositories/ha-entries.repository";
import { DuplicateService } from "./duplicate.service";

/** Duplicates in the demo home, through the real services. */
function setup() {
  const fake = new FakeHa(createDemoHome());
  const ha = new DemoHaConnectionService(fake);
  const overlay = new MemoryOverlayRepository({});
  const categories = new CategoriesService(new HaCategoriesRepository(ha), overlay);
  const entries = new EntriesService(new HaEntriesRepository(ha), overlay, categories);
  const editor = new HaEditorRepository(ha, new DemoHaRestService(fake));
  const editorService = new EditorService(editor);
  const flows = new FlowsService(
    editor,
    editorService,
    categories,
    overlay,
    () => Promise.resolve(),
    () => 1_700_000_000_000,
  );

  return { service: new DuplicateService(flows, editorService, entries, editor), entries, editor };
}

describe("DuplicateService", () => {
  it("copies an automation with folder, labels and area, switched off", async () => {
    const { service, entries, editor } = setup();

    const { entityId } = await service.duplicate(
      "automation.terrace_light_on_motion",
      "Terrace light on motion (Kopie)",
    );

    const all = await entries.findAll();
    const original = all.find((entry) => entry.entityId === "automation.terrace_light_on_motion");
    const copy = all.find((entry) => entry.entityId === entityId);
    expect(copy).toMatchObject({
      name: "Terrace light on motion (Kopie)",
      categoryPath: original?.categoryPath,
      labels: original?.labels,
      area: original?.area,
      state: "off",
    });

    const config = await editor.loadConfig("automation", entityId);
    const source = await editor.loadConfig("automation", "automation.terrace_light_on_motion");
    expect(config.triggers).toEqual(source.triggers);
    expect(config.id).not.toBe(source.id);
  });

  it("copies a script under a new key", async () => {
    const { service, editor } = setup();

    const { entityId } = await service.duplicate("script.terrace_evening_mood", "Evening mood 2");

    expect(entityId).not.toBe("script.terrace_evening_mood");
    const config = await editor.loadConfig("script", entityId);
    expect(config.alias).toBe("Evening mood 2");
    expect(Array.isArray(config.sequence)).toBe(true);
  });
});
