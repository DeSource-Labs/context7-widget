import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2026-07-15',
  modules: ['@desource/context7-widget-nuxt'],
  context7Widget: {
    defaults: {
      library: '/desource-labs/context7-widget',
      theme: 'auto'
    }
  },
  css: ['~/assets/styles/main.scss'],
  devtools: { enabled: false },
  ssr: true,
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Context7 Widget · Your design, better docs chat',
      meta: [
        {
          name: 'description',
          content:
            'Upgrade the Context7 widget to match your site. Custom fonts, colors, triggers, and better chat UX. Free and open source, with a script or native framework package.'
        },
        { property: 'og:title', content: 'Context7 Widget · Your design, better docs chat' },
        {
          property: 'og:description',
          content:
            'Your docs assistant should look like it belongs. Keep Context7 answers, match your design, and help visitors try your product. Free and open source.'
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://context7.desourcelabs.com' },
        { name: 'twitter:card', content: 'summary_large_image' }
      ],
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]
    }
  },
  nitro: {
    prerender: {
      routes: ['/', '/customization', '/examples', '/live']
    }
  },
  vite: {
    build: {
      modulePreload: {
        polyfill: false
      }
    },
    optimizeDeps: {
      include: ['@lucide/vue', 'postprocessing', 'three']
    }
  },
  typescript: {
    strict: true
  }
});
