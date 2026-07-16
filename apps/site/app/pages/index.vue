<template>
  <main>
    <section class="hero">
      <HeroScene />
      <header class="site-header">
        <a class="brand" href="/" aria-label="Context7 Widget home">
          <span>7</span>
          Context7 Widget
        </a>
        <nav aria-label="Primary navigation">
          <a href="#paths">Paths</a>
          <a href="#lab">Lab</a>
          <a href="/examples">Examples</a>
          <a href="/customization">Customize</a>
          <a href="#use-cases">Use cases</a>
        </nav>
      </header>

      <div class="hero__content">
        <p class="eyebrow">Script replacement · TypeScript core · Vue bindings</p>
        <h1>Context7 Widget</h1>
        <p>
          A themeable Context7-compatible widget system for product sites that need the docs chat to look native, emit
          useful events, and still ship through a single hosted script.
        </p>
        <div class="hero__actions">
          <a class="button button--primary" href="#lab">
            <SlidersHorizontal :size="18" aria-hidden="true" />
            Configure
          </a>
          <a
            class="button button--ghost"
            href="https://github.com/DeSource-Labs/context7-widget"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github :size="18" aria-hidden="true" />
            GitHub
          </a>
          <a class="button button--ghost" href="/examples">
            <BookOpen :size="18" aria-hidden="true" />
            Examples
          </a>
          <a class="button button--ghost" href="/customization">
            <Palette :size="18" aria-hidden="true" />
            Customize
          </a>
        </div>
      </div>
    </section>

    <section class="showcase-section">
      <div class="showcase-copy">
        <p class="eyebrow">Documentation as an interface</p>
        <h2>Readable enough to ship, visual enough to remember.</h2>
        <p>
          The page teaches the install paths while demonstrating the design contract: shadow parts, CSS variables,
          events, custom triggers, and package-level helpers all appear as live surfaces instead of a static README.
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
        <p class="eyebrow">Three integration paths</p>
        <h2>Pick the surface that matches the project.</h2>
        <p>
          Replace the script URL, install the core helpers, or use Vue props and composables when the widget belongs
          inside a component tree.
        </p>
      </div>

      <div class="path-grid">
        <article v-for="(path, index) in paths" :key="path.title" class="path-card" :class="path.class">
          <span class="path-card__index">0{{ index + 1 }}</span>
          <component :is="path.icon" :size="22" aria-hidden="true" />
          <h3>{{ path.title }}</h3>
          <p>{{ path.copy }}</p>
        </article>
      </div>

      <div class="install-grid">
        <CodeBlock id="script-install" label="Drop-in script" :code="scriptInstall" />
        <CodeBlock id="core-install" label="Core package" :code="coreInstall" />
        <CodeBlock id="vue-install" label="Vue package" :code="vueInstall" />
      </div>
    </section>

    <LiveWidgetLab />

    <section id="use-cases" class="use-cases-section">
      <div class="section-heading">
        <p class="eyebrow">Use cases</p>
        <h2>Useful beyond a prettier launcher.</h2>
      </div>

      <div class="use-case-list">
        <article v-for="item in useCases" :key="item.title" class="use-case">
          <span>{{ item.number }}</span>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="maintenance-section">
      <div>
        <p class="eyebrow">Maintenance loop</p>
        <h2>Upstream stays visible.</h2>
        <p>
          The scanner keeps the official Context7 widget snapshot in the repository and opens an issue when the
          unversioned script changes, so compatibility work is explicit instead of accidental.
        </p>
      </div>
      <CodeBlock id="scanner" label="Daily scanner" :code="scannerCode" />
    </section>

    <footer class="site-footer">
      <span>DeSource Labs</span>
      <a href="/widget.js">Hosted widget.js</a>
      <a href="https://context7.com" target="_blank" rel="noopener noreferrer">Context7</a>
    </footer>
  </main>
</template>

<script setup lang="ts">
import {
  ArrowUp,
  BookOpen,
  Braces,
  Github,
  Package,
  Palette,
  PanelRightOpen,
  SlidersHorizontal,
  X
} from 'lucide-vue-next';

const scriptInstall =
  `<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
  data-color="#10b981"
></scr` + `ipt>`;

const coreInstall = `pnpm add @desource/context7-widget

import { mountContext7Widget } from "@desource/context7-widget";

mountContext7Widget({
  library: "/vercel/next.js",
  theme: "auto",
  color: "#10b981"
});`;

const vueInstall = `pnpm add @desource/context7-widget-vue

<Context7Widget
  library="/vercel/next.js"
  color="#10b981"
  @question="trackQuestion"
/>`;

const scannerCode = `pnpm scan:upstream

# stores:
# upstream/context7-widget.latest.js
# upstream/context7-widget.normalized.js
# upstream/context7-widget.sha256`;

const paths = [
  {
    class: 'path-card--large',
    copy: 'The lowest-friction replacement for existing Context7 users. Keep data-library, swap the script origin.',
    icon: PanelRightOpen,
    title: '/widget.js'
  },
  {
    class: '',
    copy: 'Typed helpers for creating widgets, generating copy-paste script tags, and controlling instances from app code.',
    icon: Braces,
    title: 'Core TypeScript'
  },
  {
    class: '',
    copy: 'A Vue 3 component, composable, plugin helper, typed events, and optional SCSS-built trigger styles.',
    icon: Package,
    title: 'Vue package'
  }
];

const eventPulses = ['ready', 'open', 'question', 'first-token', 'tool-call', 'answer-complete', 'error'];

const useCases = [
  {
    copy: 'Expose custom properties and shadow parts so the widget can match dense dashboards, editorial docs, or launch pages.',
    number: '01',
    title: 'Design-system theming'
  },
  {
    copy: 'Listen for question, first-token, answer-complete, tool-call, and error events for analytics or user research.',
    number: '02',
    title: 'Product instrumentation'
  },
  {
    copy: 'Bind the widget to a header button, command palette, or support menu item; the launcher hides automatically.',
    number: '03',
    title: 'Custom triggers'
  },
  {
    copy: 'Use the same runtime from plain HTML, framework code, Vue apps, and this Nuxt information site.',
    number: '04',
    title: 'One runtime, many hosts'
  }
];
</script>
