import type { Area, Label } from "@/types/entry";

import { apiFetch } from "./api";

export function fetchAreas(): Promise<Area[]> {
  return apiFetch<Area[]>("/areas");
}

export function fetchLabels(): Promise<Label[]> {
  return apiFetch<Label[]>("/labels");
}
