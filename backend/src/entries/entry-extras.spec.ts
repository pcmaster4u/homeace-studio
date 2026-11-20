import { EMPTY_OVERLAY, type Overlay } from "../overlay/overlay.model";
import { applyExtras, removeExtras, withExtras } from "./entry-extras";
import type { Entry } from "./entry.model";

const overlay: Overlay = {
  ...EMPTY_OVERLAY,
  favorites: ["script.gute_nacht"],
  notes: { "script.gute_nacht": "Vor dem Schlafen" },
};

function entry(entityId: string): Entry {
  return {
    entityId,
    kind: "script",
    domain: "script",
    name: entityId,
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
  };
}

describe("entry extras", () => {
  it("adds favorite and note from the overlay", () => {
    const [withNote, plain] = withExtras(
      [entry("script.gute_nacht"), entry("script.alles_aus")],
      overlay,
    );

    expect(withNote).toMatchObject({ isFavorite: true, note: "Vor dem Schlafen" });
    expect(plain).toMatchObject({ isFavorite: false, note: null });
  });

  it("changes only the given fields and drops blank notes", () => {
    const unfavored = applyExtras(overlay, "script.gute_nacht", { isFavorite: false });
    const noteCleared = applyExtras(overlay, "script.gute_nacht", { note: "  " });
    const added = applyExtras(EMPTY_OVERLAY, "scene.kino", { isFavorite: true, note: " Popcorn " });

    expect(unfavored.favorites).toEqual([]);
    expect(unfavored.notes).toEqual(overlay.notes);
    expect(noteCleared.favorites).toEqual(["script.gute_nacht"]);
    expect(noteCleared.notes).toEqual({});
    expect(added).toMatchObject({ favorites: ["scene.kino"], notes: { "scene.kino": "Popcorn" } });
  });

  it("removes everything of a deleted entity", () => {
    expect(removeExtras(overlay, "script.gute_nacht")).toMatchObject({ favorites: [], notes: {} });
  });
});
