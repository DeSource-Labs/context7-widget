import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2026-07-15',
  css: ['@desource/context7-widget-vue/styles.css', '~/assets/styles/main.scss'],
  devtools: { enabled: false },
  ssr: true,
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Context7 Widget by DeSource Labs',
      meta: [
        {
          name: 'description',
          content:
            'Themeable Context7 widget script, TypeScript core package, Vue bindings, and integration examples for polished docs and product sites.'
        },
        { property: 'og:title', content: 'Context7 Widget by DeSource Labs' },
        {
          property: 'og:description',
          content: 'A customizable Context7-compatible widget with script, core, and Vue integration paths.'
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://context7.desource-labs.org' },
        { name: 'twitter:card', content: 'summary_large_image' }
      ],
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]
    }
  },
  nitro: {
    prerender: {
      routes: ['/']
    }
  },
  vite: {
    optimizeDeps: {
      include: ['lucide-vue-next', 'postprocessing', 'three']
    }
  },
  typescript: {
    strict: true
  }
});
