import { buildHelperPayload, HelperSettingsError } from "./helper-payload";

function fieldOf(action: () => unknown): string | null {
  try {
    action();
    return null;
  } catch (error) {
    return error instanceof HelperSettingsError ? error.field : "unexpected error";
  }
}

describe("buildHelperPayload", () => {
  it("sends only name and icon for a toggle", () => {
    expect(buildHelperPayload("input_boolean", "Gästemodus", "mdi:account", {})).toEqual({
      name: "Gästemodus",
      icon: "mdi:account",
    });
  });

  it("maps input_number settings to HA names and fills defaults", () => {
    const payload = buildHelperPayload("input_number", "Helligkeit", undefined, {
      min: 10,
      max: 100,
      unitOfMeasurement: "%",
    });

    expect(payload).toEqual({
      name: "Helligkeit",
      min: 10,
      max: 100,
      step: 1,
      mode: "slider",
      unit_of_measurement: "%",
    });
  });

  it("rejects an input_number whose max is not above min", () => {
    expect(
      fieldOf(() => buildHelperPayload("input_number", "X", undefined, { min: 5, max: 5 })),
    ).toBe("max");
    expect(fieldOf(() => buildHelperPayload("input_number", "X", undefined, { max: 5 }))).toBe(
      "min",
    );
  });

  it("trims select options and rejects empty, blank or duplicate lists", () => {
    const payload = buildHelperPayload("input_select", "Status", undefined, {
      options: [" Aus ", "Läuft"],
    });

    expect(payload.options).toEqual(["Aus", "Läuft"]);
    expect(fieldOf(() => buildHelperPayload("input_select", "X", undefined, { options: [] }))).toBe(
      "options",
    );
    expect(
      fieldOf(() => buildHelperPayload("input_select", "X", undefined, { options: ["a", "a"] })),
    ).toBe("options");
  });

  it("needs date or time for input_datetime", () => {
    const settings = { hasDate: false, hasTime: false };

    expect(fieldOf(() => buildHelperPayload("input_datetime", "X", undefined, settings))).toBe(
      "hasDate",
    );
  });

  it("checks counter limits and timer durations", () => {
    expect(
      buildHelperPayload("counter", "Zähler", undefined, { minimum: 0, maximum: 10 }),
    ).toMatchObject({ initial: 0, step: 1, restore: true, minimum: 0, maximum: 10 });
    expect(
      fieldOf(() => buildHelperPayload("counter", "X", undefined, { minimum: 5, maximum: 1 })),
    ).toBe("maximum");
    expect(buildHelperPayload("timer", "Nachlauf", undefined, { duration: "0:05:00" })).toEqual({
      name: "Nachlauf",
      duration: "0:05:00",
      restore: false,
    });
    expect(fieldOf(() => buildHelperPayload("timer", "X", undefined, { duration: "5 min" }))).toBe(
      "duration",
    );
  });
});
