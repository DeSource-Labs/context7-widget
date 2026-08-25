<script setup lang="ts">
const docs = useContext7Widget();
const hasComposable = typeof docs.open === 'function' && typeof docs.send === 'function';
const hydrated = ref(false);

onMounted(() => {
  hydrated.value = true;
});
</script>

<template>
  <main>
    <div id="contract-sentinel">context7-widget-nuxt:basic-ok</div>
    <div id="composable-status">{{ hasComposable ? 'composable:yes' : 'composable:no' }}</div>
    <div id="hydration-status">{{ hydrated ? 'hydration:ready' : 'hydration:pending' }}</div>
    <Context7Widget />
  </main>
</template>
