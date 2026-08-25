import { defineNuxtConfig } from 'nuxt/config';
import context7Widget from '../../../src/module';

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  modules: [context7Widget],
  context7Widget: {
    defaults: {
      initialMessage: 'Ask about {library}.',
      library: '/vercel/nuxt',
      position: 'anchor',
      preset: 'glass',
      widgetId: 'nuxt-docs'
    }
  }
});
