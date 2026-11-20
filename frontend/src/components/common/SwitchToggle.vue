<template>
  <button
    class="switch-toggle"
    :class="{ 'switch-toggle--on': isOn }"
    type="button"
    role="switch"
    :aria-checked="isOn"
    :aria-label="label"
    @click="isOn = !isOn"
  />
</template>

<script setup lang="ts">
const isOn = defineModel<boolean>({ required: true });

defineProps<{
  label: string;
}>();
</script>

<style scoped>
.switch-toggle {
  position: relative;
  flex: none;
  width: 36px;
  height: 21px;
  border: 0;
  border-radius: 999px;
  background: var(--line-strong);
  cursor: pointer;
  transition: background 0.15s;
}

.switch-toggle::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s;
}

.switch-toggle--on {
  background: var(--ok);
}

.switch-toggle--on::after {
  transform: translateX(15px);
}
</style>
