export const PANE = {
  nav: "nav",
  list: "list",
} as const;

export type Pane = (typeof PANE)[keyof typeof PANE];

export const DEFAULT_PANE_WIDTHS: Record<Pane, number> = { nav: 268, list: 390 };

/** Min and max width per resizable pane, in pixels. */
export const PANE_WIDTH_LIMITS: Record<Pane, { min: number; max: number }> = {
  nav: { min: 200, max: 440 },
  list: { min: 300, max: 700 },
};

/** One arrow key press on a focused splitter moves it by this much. */
export const SPLITTER_KEYBOARD_STEP = 16;
