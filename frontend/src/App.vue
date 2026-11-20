<template>
  <RouterView />
</template>

<script setup lang="ts">
import { watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { useMessagesStore } from "@/stores/messagesStore";
import { useSettingsStore } from "@/stores/settingsStore";

const settings = useSettingsStore();
const messages = useMessagesStore();
const { locale } = useI18n();

// The chosen language lives in the settings store; i18n, <html lang> and the backend's
// message catalog (texts for error IDs) follow it.
watchEffect(() => {
  locale.value = settings.locale;
  document.documentElement.lang = settings.locale;
  void messages.load(settings.locale);
});
</script>
