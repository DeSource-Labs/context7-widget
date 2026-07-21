<template>
  <nav class="logo-ballpit" :class="{ 'logo-ballpit--compact': compact }" aria-label="Framework package links">
    <a
      v-for="(item, index) in items"
      :key="item.label"
      class="logo-ballpit__bubble"
      :class="{ 'logo-ballpit__bubble--soon': item.soon }"
      :href="item.href"
      :rel="item.external ? 'noopener noreferrer' : undefined"
      :style="bubbleStyle(index)"
      :target="item.external ? '_blank' : undefined"
      :aria-label="item.soon ? `${item.label} package coming soon` : item.label"
    >
      <img alt="" :src="item.logo" loading="eager" draggable="false" />
      <span class="logo-ballpit__shine" aria-hidden="true" />
      <span v-if="item.soon" class="logo-ballpit__badge">soon</span>
      <span class="logo-ballpit__label">{{ item.label }}</span>
    </a>
  </nav>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean;
  }>(),
  {
    compact: false
  }
);

type LogoItem = {
  external: boolean;
  href: string;
  label: string;
  logo: string;
  soon?: boolean;
};

const repo = 'https://github.com/DeSource-Labs/context7-widget/tree/main';
const items: LogoItem[] = [
  { external: false, href: '/widget.js', label: 'JS widget', logo: '/img/js.png' },
  { external: true, href: `${repo}/packages/core`, label: 'TypeScript', logo: '/img/ts.png' },
  { external: true, href: `${repo}/packages/react`, label: 'React', logo: '/img/react.png', soon: true },
  { external: true, href: `${repo}/packages/vue`, label: 'Vue', logo: '/img/vue.png' },
  { external: true, href: `${repo}/packages/nuxt`, label: 'Nuxt', logo: '/img/nuxt.png', soon: true },
  { external: true, href: `${repo}/packages/svelte`, label: 'Svelte', logo: '/img/svelte.png', soon: true },
  { external: true, href: `${repo}/packages/angular`, label: 'Angular', logo: '/img/angular.png', soon: true }
];

function bubbleStyle(index: number) {
  return { '--bubble-index': index };
}
</script>
