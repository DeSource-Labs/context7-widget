<template>
  <main>
    <SiteHero
      eyebrow="Context7 answers, your interface"
      title="Context7 Widget"
      description="Add docs chat to your product, docs, or dashboard. Use the Context7 backend, but control the trigger, position, theme, and product feel."
      tone="mint"
      :marquee-items="heroMarqueeItems"
    >
      <template #actions>
        <a class="button button--primary" href="/examples">
          <SlidersHorizontal :size="18" aria-hidden="true" />
          Try it now
        </a>
        <a class="button button--ghost" href="/customization">
          <Palette :size="18" aria-hidden="true" />
          Customize
        </a>
        <a
          class="button button--ghost"
          href="https://github.com/DeSource-Labs/context7-widget"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitFork :size="18" aria-hidden="true" />
          GitHub
        </a>
      </template>

      <template #product>
        <HeroWidgetDialog class="site-hero__dialog site-hero__dialog--home" tone="mint" />
      </template>
    </SiteHero>

    <section id="how-it-works" class="audience-section">
      <div class="section-heading">
        <p class="eyebrow">Who it is for</p>
        <h2>Same answers. Better surface.</h2>
        <p>
          Some teams already use the official script and need styling. Others just want users to find answers without
          opening support. Both start here.
        </p>
      </div>

      <div class="audience-grid">
        <article v-for="item in audiences" :key="item.title" class="audience-card">
          <span>{{ item.kicker }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.copy }}</p>
        </article>
      </div>
    </section>

    <section class="showcase-section">
      <div class="showcase-copy">
        <p class="eyebrow">Documentation as a product surface</p>
        <h2>The assistant should match the product it explains.</h2>
        <p>
          Context7 provides the grounded documentation answers. This widget provides the production layer around them:
          placement, presets, custom triggers, analytics events, and a styling contract that design systems can trust.
        </p>
      </div>

      <div class="showcase-stage" aria-label="Context7 widget surfaces">
        <article class="showcase-card showcase-card--widget">
          <div class="mini-widget">
            <div class="mini-widget__header">
              <span>Context7 Docs</span>
              <X :size="15" aria-hidden="true" />
            </div>
            <div class="mini-widget__body">
              <span class="bubble bubble--assistant">Ask about setup, API usage, or styles.</span>
              <span class="bubble bubble--user">Use my own trigger?</span>
              <span class="bubble bubble--assistant">Set data-custom-trigger; the launcher steps aside.</span>
            </div>
            <div class="mini-widget__input">
              <span>Ask about the docs...</span>
              <ArrowUp :size="15" aria-hidden="true" />
            </div>
          </div>
        </article>

        <article class="showcase-card showcase-card--code">
          <span class="window-title">theme.scss</span>
          <pre><code>context7-widget {
  --c7-accent: #7cffb2;
  --c7-panel-radius: 8px;
}

context7-widget::part(send-button) {
  text-transform: uppercase;
}</code></pre>
        </article>

        <article class="showcase-card showcase-card--events">
          <span v-for="event in eventPulses" :key="event">{{ event }}</span>
        </article>
      </div>
    </section>

    <section id="paths" class="paths-section">
      <div class="section-heading">
        <p class="eyebrow">Choose an entry point</p>
        <h2>One widget contract, three ways to ship it.</h2>
        <p>
          Start with a script tag. Move to TypeScript helpers or Vue when the widget becomes part of your application
          code.
        </p>
      </div>

      <div class="path-grid">
        <article v-for="(path, index) in paths" :key="path.title" class="path-card" :class="path.class">
          <span class="path-card__index">0{{ index + 1 }}</span>
          <component :is="path.icon" :size="22" aria-hidden="true" />
          <h3>{{ path.title }}</h3>
          <p>{{ path.copy }}</p>
          <a :href="path.href">{{ path.cta }}</a>
        </article>
      </div>

      <div class="install-grid">
        <CodeBlock id="script-install" label="Drop-in script" :code="scriptInstall" />
        <CodeBlock id="core-install" label="Core package" :code="coreInstall" />
        <CodeBlock id="vue-install" label="Vue package" :code="vueInstall" />
      </div>
    </section>

    <section id="use-cases" class="use-cases-section">
      <div class="section-heading">
        <p class="eyebrow">Where it fits</p>
        <h2>Put docs help where the question happens.</h2>
      </div>

      <div class="use-case-grid">
        <article v-for="item in useCases" :key="item.title" class="use-case">
          <span>{{ item.number }}</span>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowUp, Braces, GitFork, Package, Palette, PanelRightOpen, SlidersHorizontal, X } from '@lucide/vue';

const scriptInstall =
  `<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-color="#10b981"
></scr` + `ipt>`;

const coreInstall = `pnpm add @desource/context7-widget

import { mountContext7Widget } from "@desource/context7-widget";

mountContext7Widget({
  library: "/owner/repo",
  theme: "auto",
  color: "#10b981"
});`;

const vueInstall = `pnpm add @desource/context7-widget-vue

<Context7Widget
  library="/owner/repo"
  color="#10b981"
  @question="trackQuestion"
/>`;

const heroMarqueeItems = librariesArray.map(({ key, href, label, logo }) => ({ key, href, label, logo }));

const paths = [
  {
    class: 'path-card--large',
    copy: 'For static docs, Docusaurus, Astro, marketing pages, and quick product installs. Paste one tag and keep moving.',
    cta: 'Open hosted script',
    href: '/widget.js',
    icon: PanelRightOpen,
    title: '/widget.js'
  },
  {
    class: '',
    copy: 'For apps that need typed options, runtime control, script generation, and shared types for framework bindings.',
    cta: 'View core package',
    href: 'https://github.com/DeSource-Labs/context7-widget/tree/main/packages/core',
    icon: Braces,
    title: 'Core TypeScript'
  },
  {
    class: '',
    copy: 'For Vue apps that want a component, composable, typed events, managed trigger button, and scoped styles.',
    cta: 'View Vue package',
    href: 'https://github.com/DeSource-Labs/context7-widget/tree/main/packages/vue',
    icon: Package,
    title: 'Vue package'
  }
];

const audiences = [
  {
    copy: 'Change the script URL. Keep Context7. Add presets, custom triggers, centered dialogs, variables, parts, and events.',
    kicker: 'Already using Context7',
    title: 'Keep the backend. Replace the surface.'
  },
  {
    copy: 'Context7 reads your docs. This widget gives visitors a branded place to ask questions on your site.',
    kicker: 'New to Context7',
    title: 'Add docs help without building support chat.'
  },
  {
    copy: 'Start with the script. Developers can move to Vue or TypeScript later without changing the visitor experience.',
    kicker: 'Product owner',
    title: 'Ship a helpful assistant before a long roadmap.'
  }
];

const eventPulses = ['ready', 'open', 'cancel', 'question', 'first-token', 'tool-call', 'answer-complete', 'error'];

const useCases = [
  {
    copy: 'Put a small trigger in the product shell and answer setup questions before users leave the screen.',
    number: '01',
    title: 'Developer dashboards'
  },
  {
    copy: 'Use a centered dialog for deliberate help moments: onboarding, empty states, and pricing or API pages.',
    number: '02',
    title: 'Guided product moments'
  },
  {
    copy: 'Anchor the widget to a nav item, command palette action, header button, or existing support menu.',
    number: '03',
    title: 'Custom help entry points'
  },
  {
    copy: 'Use script, TypeScript, or Vue today. React, Nuxt, Svelte, and Angular packages are next on the same core.',
    number: '04',
    title: 'Framework-ready apps'
  }
];
</script>
