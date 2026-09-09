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
        { property: 'og:image', content: 'https://context7.desourcelabs.com/og.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/jpeg' },
        {
          property: 'og:image:alt',
          content: 'Context7 chat, your design. A free, customizable widget upgrade by DeSource Labs.'
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://context7.desourcelabs.com/og.jpg' },
        { name: 'theme-color', content: '#101513' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', href: '/logo/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
        { rel: 'icon', href: '/logo/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
        { rel: 'apple-touch-icon', href: '/logo/apple-touch-icon.png', sizes: '180x180' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
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
      include: ['postprocessing', 'three']
    }
  },
  typescript: {
    strict: true
  }
});
