import { defineStore } from "pinia";
import { ref } from "vue";

export type ToastTone = "success" | "error";

export type Toast = {
  id: number;
  text: string;
  tone: ToastTone;
};

/** Errors stay a bit longer, because they usually need reading. */
const TOAST_DURATION_MS: Record<ToastTone, number> = { success: 3200, error: 6000 };

/** Short feedback at the bottom of the screen ("Verschoben", "Umbenennen fehlgeschlagen"). */
export const useToastStore = defineStore("toast", () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 1;

  function show(text: string, tone: ToastTone = "success"): void {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, text, tone }];
    setTimeout(() => dismiss(id), TOAST_DURATION_MS[tone]);
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  return { toasts, show, dismiss };
});
