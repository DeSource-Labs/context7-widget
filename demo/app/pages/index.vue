<template>
  <main>
    <SiteHero
      eyebrow="Free, open-source widget upgrade"
      title="Context7 chat, your design."
      description="Your site has a design of its own. Give Context7 docs chat the same attention, with your fonts, colors, and help button, plus a better experience for readers."
      tone="mint"
      :marquee-items="heroMarqueeItems"
    >
      <template #actions>
        <a class="button button--primary" href="/examples">
          <SiteIcon name="sliders-horizontal" :size="18" aria-hidden="true" />
          Try the upgrade
        </a>
        <a class="button button--ghost" href="/customization">
          <SiteIcon name="palette" :size="18" aria-hidden="true" />
          Customize
        </a>
        <a
          class="button button--ghost"
          href="https://github.com/DeSource-Labs/context7-widget"
          target="_blank"
          rel="noopener noreferrer"
        >
          <SiteIcon name="github-logo" :size="18" aria-hidden="true" />
          GitHub
        </a>
      </template>

      <template #product>
        <HeroWidgetDialog class="site-hero__dialog site-hero__dialog--home" tone="mint" />
      </template>
    </SiteHero>

    <section id="how-it-works" class="audience-section">
      <div class="section-heading">
        <p class="eyebrow">Why we built it</p>
        <h2>Your docs widget should look like it belongs.</h2>
        <p>
          Context7 provides its docs widget and hosted AI answers for free. The official widget has basic styling
          options, which can leave the chat feeling out of place on a carefully designed page. We built this upgrade so
          you can give the assistant the same care as the rest of your product.
        </p>
        <p>
          Context7 made docs chat free for library owners. We built on that initiative with a free, open-source
          interface you can make your own. Context7 continues to host the documentation search and AI answers.
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
        <p class="eyebrow">Designed for your app</p>
        <h2>Style every part of the conversation.</h2>
        <p>
          Set the type, spacing, colors, and panel shape. Open it from your own help button. Visitors can copy code, ask
          multiline questions, stop a response, or retry. When they scroll up to read, the conversation stays put.
        </p>
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
      </div>

      <div class="showcase-stage" aria-label="Widget design and chat features">
        <article class="showcase-card showcase-card--widget">
          <HeroWidgetDialog
            title="Context7 Docs"
            :messages="[
              { kind: 'assistant', text: 'Ask about setup, API usage, or styles.' },
              { kind: 'user', text: 'Can I use our help button?' },
              { kind: 'assistant', text: 'Yes. Open chat from your button and place the panel beside it.' }
            ]"
          />
        </article>

        <article class="showcase-card showcase-card--events">
          <span v-for="event in eventPulses" :key="event">{{ event }}</span>
        </article>
      </div>
    </section>

    <section id="paths" class="paths-section">
      <div class="section-heading">
        <p class="eyebrow">Make the switch</p>
        <h2>Choose the integration for your stack.</h2>
        <p>
          Already using the official widget? Replace its script URL with ours and keep your library settings. For a new
          integration, choose the script or a native package for your framework.
        </p>
        <p class="prerequisite">
          New to Context7? Claim your library, enable its widget in Admin → Chat, and allow your site's domain. Replace
          <code>/owner/repo</code> below with your library id.
        </p>
        <p class="prerequisite">
          <a href="https://context7.com/docs/howto/chat-widget" target="_blank" rel="noopener noreferrer">
            Context7 setup
          </a>
        </p>
      </div>

      <div class="path-grid">
        <article v-for="path in paths" :key="path.title" class="path-card" :class="path.class">
          <div class="path-card__heading">
            <img :src="path.logo" alt="" width="24" height="24" loading="lazy" />
            <h3>{{ path.title }}</h3>
          </div>
          <p>{{ path.copy }}</p>
          <a :href="path.href">{{ path.cta }}<SiteIcon name="arrow-square-out" :size="16" /></a>
        </article>
      </div>

      <div class="install-grid">
        <CodeBlock id="script-install" label="Drop-in script" :code="scriptInstall" />
        <CodeBlock id="core-install" label="Core package" :code="coreInstall" />
        <CodeBlock id="vue-install" label="Vue package" :code="vueInstall" />
        <CodeBlock id="nuxt-install" label="Nuxt module" :code="nuxtInstall" />
        <CodeBlock id="react-install" label="React package" :code="reactInstall" />
        <CodeBlock id="svelte-install" label="Svelte package" :code="svelteInstall" />
        <CodeBlock id="angular-install" label="Angular package" :code="angularInstall" />
      </div>
    </section>

    <section id="use-cases" class="use-cases-section">
      <div class="section-heading">
        <p class="eyebrow">Where it fits</p>
        <h2>Help people go from browsing to building.</h2>
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
const scriptInstall =
  `<script
  async
  src="https://context7.desourcelabs.com/widget.js"
  data-library="/owner/repo"
  data-color="#10b981"
></scr` + `ipt>`;

const coreInstall = `npm install @desource/context7-widget

import { mountContext7Widget } from "@desource/context7-widget";

mountContext7Widget({
  library: "/owner/repo",
  theme: "auto",
  color: "#10b981"
});`;

const vueInstall =
  `npm install @desource/context7-widget-vue

<script setup>
import { Context7Widget } from "@desource/context7-widget-vue";
import "@desource/context7-widget-vue/styles.css";
</scr` +
  `ipt>

<template>
  <Context7Widget library="/owner/repo" color="#10b981" />
</template>`;

const nuxtInstall = `npm install @desource/context7-widget-nuxt

export default defineNuxtConfig({
  modules: ["@desource/context7-widget-nuxt"],
  context7Widget: {
    defaults: { library: "/owner/repo", preset: "glass" }
  }
});`;

const reactInstall = `npm install @desource/context7-widget-react

import { Context7Widget } from "@desource/context7-widget-react/component";
import "@desource/context7-widget-react/styles.css";

export function DocsHelp() {
  return <Context7Widget library="/owner/repo" color="#10b981" />;
}`;

const svelteInstall =
  `npm install @desource/context7-widget-svelte

<script>
import { Context7Widget } from "@desource/context7-widget-svelte";
import "@desource/context7-widget-svelte/styles.css";
</scr` +
  `ipt>

<Context7Widget
  library="/owner/repo"
  preset="glass"
  customTrigger
/>`;

const angularInstall = `npm install @desource/context7-widget-angular

// In styles.css: @import '@desource/context7-widget-angular/styles.css';
import { Component } from "@angular/core";
import { Context7Widget } from "@desource/context7-widget-angular";

@Component({
  selector: 'docs-help',
  imports: [Context7Widget],
  template: \`<context7-widget
    library="/owner/repo"
    preset="glass"
    [customTrigger]="true"
  />\`
})
export class DocsHelp {}`;

const heroMarqueeItems = librariesArray.map(({ key, href, label, logo }) => ({ key, href, label, logo }));

const paths = [
  {
    class: 'path-card--large',
    copy: 'Replace the official script URL or add one tag to a new site. Works with static pages, docs, and marketing sites.',
    cta: 'Open hosted script',
    href: '/widget.js',
    logo: '/img/js.png',
    title: '/widget.js'
  },
  {
    class: '',
    copy: 'Mount and control the widget with TypeScript, generate script tags, or build your own interface from shared helpers.',
    cta: 'View core package',
    href: 'https://github.com/DeSource-Labs/context7-widget/tree/main/packages/core',
    logo: '/img/ts.png',
    title: 'Core TypeScript'
  },
  {
    class: '',
    copy: 'Add a native Vue component, style it with your CSS, and open it from a slot or the composable.',
    cta: 'View Vue package',
    href: 'https://github.com/DeSource-Labs/context7-widget/tree/main/packages/vue',
    logo: '/img/vue.png',
    title: 'Vue package'
  },
  {
    class: '',
    copy: 'Register one module for auto-imports, styles, and shared defaults across your Nuxt site.',
    cta: 'View Nuxt module',
    href: 'https://github.com/DeSource-Labs/context7-widget/tree/main/packages/nuxt',
    logo: '/img/nuxt.png',
    title: 'Nuxt module'
  },
  {
    class: '',
    copy: 'Use a native React component with controlled state, typed callbacks, custom triggers, and a hook.',
    cta: 'View React package',
    href: 'https://github.com/DeSource-Labs/context7-widget/tree/main/packages/react',
    logo: '/img/react.png',
    title: 'React package'
  },
  {
    class: '',
    copy: 'Use Svelte 5 snippets for your trigger, bind visibility, and control chat through a reactive controller.',
    cta: 'View Svelte package',
    href: 'https://github.com/DeSource-Labs/context7-widget/tree/main/packages/svelte',
    logo: '/img/svelte.png',
    title: 'Svelte package'
  },
  {
    class: '',
    copy: 'Add a standalone component with signals, app defaults, custom trigger content, and an injectable service.',
    cta: 'View Angular package',
    href: 'https://github.com/DeSource-Labs/context7-widget/tree/main/packages/angular',
    logo: '/img/angular.png',
    title: 'Angular package'
  }
];

const audiences = [
  {
    copy: 'Replace the official script URL with ours. Your library and allowed domains carry over. Then style the widget to match your site.',
    kicker: 'Already using Context7',
    title: 'Upgrade your existing widget.'
  },
  {
    copy: 'Let visitors ask about capabilities, find a code example, and work through setup while they explore your site.',
    kicker: 'New to Context7',
    title: 'Help visitors try your product.'
  },
  {
    copy: 'Match the fonts, spacing, buttons, and colors you have already chosen. Put chat in the corner, beside a trigger, or in a centered dialog.',
    kicker: 'Product owner',
    title: 'Keep your design in every detail.'
  }
];

const eventPulses = ['ready', 'open', 'cancel', 'question', 'first-token', 'tool-call', 'answer-complete', 'error'];

const useCases = [
  {
    copy: 'Answer questions about features and integration on your product pages, while visitors decide whether your library fits.',
    number: '01',
    title: 'Product discovery'
  },
  {
    copy: 'Give new users a place to ask about setup and copy an example as they work through their first integration.',
    number: '02',
    title: 'The first integration'
  },
  {
    copy: 'Add chat beside your docs navigation so readers can ask a follow-up question without losing their place.',
    number: '03',
    title: 'Documentation sites'
  },
  {
    copy: 'Open help from an empty state, dashboard, or existing support menu, with the same styling as the rest of your app.',
    number: '04',
    title: 'In-product help'
  }
];
</script>
