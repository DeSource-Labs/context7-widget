import { mergeContext7WidgetOptions } from '@desource/context7-widget/kit';
import { context7WidgetDefaultsKey } from '@desource/context7-widget-vue';
import { defineNuxtPlugin, useRuntimeConfig } from '#app';
import type { ModulePublicRuntimeConfig } from '../module.js';

export default defineNuxtPlugin({
  name: 'context7-widget',
  setup(nuxtApp) {
    const publicConfig = useRuntimeConfig().public as ModulePublicRuntimeConfig;
    const defaults = mergeContext7WidgetOptions(publicConfig.context7Widget?.defaults ?? {});

    nuxtApp.vueApp.provide(context7WidgetDefaultsKey, defaults);
  }
});
