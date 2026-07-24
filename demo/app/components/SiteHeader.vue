<template>
  <header class="site-nav-wrap">
    <nav class="site-nav" aria-label="Primary navigation">
      <a class="site-nav__brand brand" href="/" aria-label="Context7 Widget home">
        <span class="site-nav__mark">7</span>
        <span>Context7 Widget</span>
      </a>

      <div class="site-nav__links">
        <a
          v-for="item in items"
          :key="item.href"
          :href="item.href"
          :target="isExternalUrl(item.href) ? '_blank' : undefined"
          :rel="isExternalUrl(item.href) ? 'noopener noreferrer' : undefined"
        >
          {{ item.label }}
        </a>
      </div>

      <a
        class="site-nav__github"
        :href="githubHref"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Context7 Widget on GitHub"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.77c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
          />
        </svg>
        <span>GitHub</span>
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
    githubHref?: string;
    items?: NavItem[];
  }>(),
  {
    githubHref: 'https://github.com/DeSource-Labs/context7-widget',
    items: () => [
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/examples', label: 'Examples' },
      { href: '/customization', label: 'Customize' }
    ]
  }
);

function isExternalUrl(value: string) {
  return value.startsWith('http');
}
</script>
