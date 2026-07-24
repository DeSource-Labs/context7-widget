<template>
  <nav class="hero-marquee" :aria-label="ariaLabel">
    <div class="hero-marquee__viewport">
      <div class="hero-marquee__track">
        <div
          v-for="groupIndex in 2"
          :key="groupIndex"
          class="hero-marquee__group"
          :aria-hidden="groupIndex > 1 ? 'true' : undefined"
        >
          <a
            v-for="item in items"
            :key="`${groupIndex}-${item.key}`"
            class="hero-marquee__item"
            target="_blank"
            rel="noopener noreferrer"
            :href="item.href"
          >
            <img :alt="`${item.label} logo`" :src="item.logo" loading="eager" draggable="false" />
            <span>{{ item.label }}</span>
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    ariaLabel?: string;
    items?: HeroMarqueeItem[];
  }>(),
  {
    ariaLabel: 'Context7 Widget package links',
    items: () => []
  }
);
</script>
