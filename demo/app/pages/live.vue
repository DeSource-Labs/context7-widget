<template>
  <main
    class="constructor-device live-example-page"
    :data-preset="options.preset"
    :data-theme="options.theme"
    :style="deviceStyle"
  >
    <div class="live-example-stage">
      <div class="constructor-doc">
        <p class="eyebrow">Widget surface</p>
        <h1>{{ options.title }}</h1>
        <p>{{ options.placeholder }}</p>
      </div>

      <button
        v-if="options.triggerMode === 'external'"
        id="live-example-trigger"
        class="constructor-external-trigger"
        type="button"
      >
        <MessageSquare :size="18" aria-hidden="true" />
        {{ options.launcherLabel }}
      </button>

      <div class="constructor-highlight-grid">
        <span v-for="item in highlights" :key="item.label">
          <small>{{ item.label }}</small>
          {{ item.value }}
        </span>
      </div>

      <div class="constructor-widget">
        <Context7Widget
          :key="widgetKey"
          :backdrop="options.backdrop"
          :close-on-outside-click="options.closeOnOutsideClick"
          :color="options.color || undefined"
          :custom-trigger="customTrigger"
          :default-open="options.defaultOpen"
          :initial-message="options.initialMessage"
          :launcher-label="options.launcherLabel"
          :launcher-variant="options.launcherVariant"
          :library="options.library"
          :panel-height="options.panelHeight"
          :panel-width="options.panelWidth"
          :placeholder="options.placeholder"
          :position="options.position"
          :preset="options.preset"
          :theme="options.theme"
          :title="options.title"
          :widget-id="options.widgetId"
        >
          <template v-if="usesTriggerSlot" #trigger="{ label }">
            <span class="constructor-trigger-dot" />
            <span>{{ label }}</span>
            <Wand2 :size="16" aria-hidden="true" />
          </template>
        </Context7Widget>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { MessageSquare, Wand2 } from 'lucide-vue-next';
import { Context7Widget, type Context7WidgetCustomTrigger } from '@desource/context7-widget-vue';
import { parseLiveExampleQuery } from '~/utils/live-example';

const route = useRoute();
const options = computed(() => parseLiveExampleQuery(route.query));
const widgetKey = computed(() => route.fullPath);
const usesTriggerSlot = computed(() => options.value.triggerMode === 'slot');
const customTrigger = computed<Context7WidgetCustomTrigger | undefined>(() => {
  if (options.value.triggerMode === 'none') return undefined;
  if (options.value.triggerMode === 'external') return 'live-example-trigger';
  return true;
});
const deviceStyle = computed(() => ({
  '--constructor-accent': options.value.color || undefined
}));
const highlights = computed(() => [
  { label: 'theme', value: options.value.theme },
  {
    label: 'trigger',
    value:
      options.value.triggerMode === 'none'
        ? 'Built-in'
        : `${options.value.triggerMode.charAt(0).toUpperCase()}${options.value.triggerMode.slice(1)} trigger`
  },
  { label: 'accent', value: options.value.color || 'preset' },
  { label: 'size', value: `${options.value.panelWidth} x ${options.value.panelHeight}` }
]);

useHead(() => ({
  title: `${options.value.title} · Live example`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
}));
</script>
