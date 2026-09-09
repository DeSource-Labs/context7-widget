<template>
  <svg
    class="site-icon"
    :width="size"
    :height="size"
    viewBox="0 0 256 256"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <use :href="`/icons.svg#${name}`" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    size?: number;
  }>(),
  { size: 20 }
);
</script>
