<template>
  <section class="site-hero" :class="`site-hero--${tone}`">
    <GridScan class="site-hero__background" v-bind="scanOptions" />
    <div class="site-hero__shade" />
    <SiteHeader :items="resolvedNavItems" />

    <div class="site-hero__layout">
      <div class="site-hero__content">
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>

        <div v-if="$slots.actions" class="site-hero__actions">
          <slot name="actions" />
        </div>
      </div>

      <div class="site-hero__product" :aria-label="productAriaLabel">
        <slot name="product" />
      </div>
    </div>

    <HeroMarquee class="site-hero__marquee" :items="marqueeItems" />
  </section>
</template>

<script setup lang="ts">
type HeroTone = 'amber' | 'blue' | 'mint';

type HeroNavItem = {
  href: string;
  label: string;
};

type HeroScanOptions = Partial<{
  bloomIntensity: number;
  bloomSmoothing: number;
  bloomThreshold: number;
  chromaticAberration: number;
  gridScale: number;
  lineJitter: number;
  lineStyle: 'dashed' | 'dotted' | 'solid';
  lineThickness: number;
  linesColor: string;
  noiseIntensity: number;
  scanColor: string;
  scanDelay: number;
  scanDirection: 'backward' | 'forward' | 'pingpong';
  scanDuration: number;
  scanGlow: number;
  scanOnClick: boolean;
  scanOpacity: number;
  scanPhaseTaper: number;
  scanSoftness: number;
  sensitivity: number;
}>;

const defaultNavItems: HeroNavItem[] = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/examples', label: 'Examples' },
  { href: '/customization', label: 'Customize' }
];

const scanDefaults = {
  amber: {
    bloomIntensity: 0.32,
    bloomSmoothing: 0.36,
    bloomThreshold: 0.05,
    chromaticAberration: 0.0015,
    gridScale: 0.09,
    lineJitter: 0.04,
    lineStyle: 'solid',
    lineThickness: 1.12,
    linesColor: '#5a5736',
    noiseIntensity: 0.012,
    scanColor: '#ffb45e',
    scanDelay: 1,
    scanDirection: 'pingpong',
    scanDuration: 3.3,
    scanGlow: 0.86,
    scanOnClick: true,
    scanOpacity: 0.74,
    scanPhaseTaper: 0.38,
    scanSoftness: 1.6,
    sensitivity: 0.38
  },
  blue: {
    bloomIntensity: 0.36,
    bloomSmoothing: 0.34,
    bloomThreshold: 0.05,
    chromaticAberration: 0.0016,
    gridScale: 0.085,
    lineJitter: 0.04,
    lineStyle: 'solid',
    lineThickness: 1.15,
    linesColor: '#315f68',
    noiseIntensity: 0.012,
    scanColor: '#7ab8ff',
    scanDelay: 0.7,
    scanDirection: 'pingpong',
    scanDuration: 3.1,
    scanGlow: 0.92,
    scanOnClick: true,
    scanOpacity: 0.78,
    scanPhaseTaper: 0.35,
    scanSoftness: 1.5,
    sensitivity: 0.42
  },
  mint: {
    bloomIntensity: 0.34,
    bloomSmoothing: 0.32,
    bloomThreshold: 0.04,
    chromaticAberration: 0.0018,
    gridScale: 0.085,
    lineJitter: 0.05,
    lineStyle: 'solid',
    lineThickness: 1.25,
    linesColor: '#265746',
    noiseIntensity: 0.012,
    scanColor: '#7cffb2',
    scanDelay: 0.9,
    scanDirection: 'pingpong',
    scanDuration: 2.8,
    scanGlow: 0.92,
    scanOnClick: true,
    scanOpacity: 0.76,
    scanPhaseTaper: 0.32,
    scanSoftness: 1.45,
    sensitivity: 0.48
  }
} satisfies Record<HeroTone, HeroScanOptions>;

const props = withDefaults(
  defineProps<{
    description: string;
    eyebrow: string;
    marqueeItems: HeroMarqueeItem[];
    navItems?: HeroNavItem[];
    productAriaLabel?: string;
    scan?: HeroScanOptions;
    title: string;
    tone?: HeroTone;
  }>(),
  {
    productAriaLabel: 'Context7 widget preview',
    tone: 'mint'
  }
);

const resolvedNavItems = computed(() => props.navItems ?? defaultNavItems);
const scanOptions = computed(() => ({
  ...scanDefaults[props.tone],
  ...(props.scan ?? {})
}));
</script>
