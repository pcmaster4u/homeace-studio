const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Fills `{name}` placeholders in a catalog text.
 *
 * @param template - e.g. "Die Kategorie „{path}“ gibt es schon."
 * @param params - Values by placeholder name; missing ones stay as written.
 * @example fillPlaceholders("Hallo {name}", { name: "Tim" }) // "Hallo Tim"
 */
export function fillPlaceholders(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(PLACEHOLDER, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

const MDI_PREFIX = "mdi:";

/**
 * Turns an HA icon name into the CSS class of the MDI font.
 *
 * @param icon - e.g. "mdi:lightbulb-outline"; other icon sets (e.g. "hass:") are not bundled.
 * @returns "mdi-lightbulb-outline", or null when the icon cannot be shown with the MDI font.
 */
export function mdiIconClass(icon: string | null): string | null {
  if (!icon?.startsWith(MDI_PREFIX)) return null;

  return `mdi-${icon.slice(MDI_PREFIX.length)}`;
}
