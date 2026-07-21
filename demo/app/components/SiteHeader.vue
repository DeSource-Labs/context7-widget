<template>
  <header class="site-header">
    <a class="brand" href="/" aria-label="Context7 Widget home">
      <span>7</span>
      Context7 Widget
    </a>
    <nav aria-label="Primary navigation">
      <a
        v-for="item in items"
        :key="item.href"
        :href="item.href"
        :target="item.href.startsWith('http') ? '_blank' : undefined"
        :rel="item.href.startsWith('http') ? 'noopener noreferrer' : undefined"
      >
        {{ item.label }}
      </a>
    </nav>
  </header>
</template>

<script setup lang="ts">
type NavItem = {
  href: string;
  label: string;
};

withDefaults(
  defineProps<{
    items?: NavItem[];
  }>(),
  {
    items: () => [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/examples', label: 'Examples' },
      { href: '/customization', label: 'Customize' },
      { href: 'https://github.com/DeSource-Labs/context7-widget', label: 'GitHub' }
    ]
  }
);
</script>
