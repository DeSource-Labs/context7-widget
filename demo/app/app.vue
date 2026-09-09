<template>
  <NuxtPage />
  <SiteFooter v-if="showsSiteFooter" />
</template>

<script setup lang="ts">
useSectionMotion();
const route = useRoute();
const showsSiteFooter = computed(() => !route.path.startsWith('/live'));
</script>
