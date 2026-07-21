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
            'Customizable Context7 documentation chat widget for product sites, docs portals, dashboards, and developer tools. Script, TypeScript core, and Vue integrations.'
        },
        { property: 'og:title', content: 'Context7 Widget by DeSource Labs' },
        {
          property: 'og:description',
          content:
            'Add a Context7-powered AI docs assistant to your site, then match it to your product with presets, CSS variables, events, and framework bindings.'
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
