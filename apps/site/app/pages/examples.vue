<template>
  <main class="examples-page">
    <section class="examples-hero">
      <header class="site-header">
        <a class="brand" href="/" aria-label="Context7 Widget home">
          <span>7</span>
          Context7 Widget
        </a>
        <nav aria-label="Primary navigation">
          <a href="/">Home</a>
          <a href="/#lab">Lab</a>
          <a href="/widget.js">widget.js</a>
        </nav>
      </header>

      <div class="examples-hero__content">
        <p class="eyebrow">Integration examples</p>
        <h1>Use the widget like a product surface.</h1>
        <p>
          Script tags, typed helpers, Vue components, modal flows, anchored triggers, presets, and CSS overrides
          share one runtime contract.
        </p>
      </div>

      <div class="examples-hero__console" aria-hidden="true">
        <span>position="anchor"</span>
        <span>preset="glass"</span>
        <span>@answer-complete</span>
        <span>data-welcome-message</span>
      </div>
    </section>

    <section class="examples-section">
      <div class="section-heading">
        <p class="eyebrow">Position use cases</p>
        <h2>Corner, modal, and anchored entry points.</h2>
        <p>
          Current Context7 installs are mostly fixed-corner docs widgets because the official script only exposes
          that shape. This package keeps that path and adds focused modal and app-shell popover patterns.
        </p>
      </div>

      <div class="example-grid">
        <article class="example-card example-card--modal">
          <div class="example-card__visual">
            <button id="example-modal-trigger" class="example-trigger example-trigger--terminal" type="button">
              <Search :size="18" aria-hidden="true" />
              Open modal help
            </button>
            <div class="example-modal-preview">
              <span />
              <strong>Terminal preset</strong>
              <p>Centered dialog with backdrop and outside-click close.</p>
            </div>
          </div>
          <CodeBlock id="example-modal-code" label="Modal script" :code="modalScript" />
        </article>

        <article class="example-card example-card--anchor">
          <div class="example-card__visual">
            <div class="example-toolbar">
              <span>Docs shell</span>
              <button id="example-anchor-trigger" class="example-trigger" type="button">
                <MessageSquare :size="18" aria-hidden="true" />
                Ask docs
              </button>
            </div>
            <div class="example-popover-preview">
              <span>Anchored to the trigger</span>
              <p>Best for nav bars, command menus, dashboards, and custom design systems.</p>
            </div>
          </div>
          <CodeBlock id="example-anchor-code" label="Vue anchored trigger" :code="anchorVue" />
        </article>

        <article class="example-card example-card--corner">
          <div class="example-card__visual">
            <div class="corner-stage">
              <span class="corner-stage__page" />
              <span class="corner-stage__launcher">7</span>
            </div>
            <div>
              <h3>Fixed corner</h3>
              <p>Drop-in replacement for Docusaurus, Next layouts, static docs, and existing Context7 script users.</p>
            </div>
          </div>
          <CodeBlock id="example-corner-code" label="Official-compatible" :code="cornerScript" />
        </article>
      </div>
    </section>

    <section class="examples-section examples-section--matrix">
      <div class="section-heading">
        <p class="eyebrow">Customization map</p>
        <h2>Preset first, variables when needed.</h2>
      </div>

      <div class="preset-strip">
        <article v-for="item in presetCards" :key="item.name" :class="['preset-card', `preset-card--${item.name}`]">
          <span>{{ item.name }}</span>
          <p>{{ item.copy }}</p>
        </article>
      </div>

      <div class="recipe-grid">
        <CodeBlock id="example-preset-color-code" label="Preset color fallback" :code="presetColorFallback" />
        <CodeBlock id="example-css-code" label="CSS overrides" :code="cssOverrides" />
        <CodeBlock id="example-core-code" label="Core helper" :code="coreHelper" />
        <CodeBlock id="example-composable-code" label="Vue composable" :code="vueComposable" />
      </div>
    </section>

    <section class="examples-section">
      <div class="section-heading">
        <p class="eyebrow">Event instrumentation</p>
        <h2>Use answers as product signals.</h2>
      </div>

      <div class="event-board">
        <article v-for="event in events" :key="event.name">
          <span>{{ event.name }}</span>
          <p>{{ event.copy }}</p>
        </article>
      </div>
    </section>

    <footer class="site-footer">
      <span>DeSource Labs</span>
      <a href="/">Home</a>
      <a href="/widget.js">Hosted widget.js</a>
    </footer>

    <Context7Widget
      close-on-outside-click
      custom-trigger="#example-modal-trigger"
      hide-default-button
      library="/desource-labs/context7-widget"
      panel-width="520px"
      position="modal"
      preset="terminal"
      title="Modal Documentation Help"
      widget-id="examples-modal"
    />

    <Context7Widget
      anchor-placement="bottom-end"
      custom-trigger="#example-anchor-trigger"
      hide-default-button
      library="/desource-labs/context7-widget"
      panel-height="420px"
      panel-width="420px"
      position="anchor"
      preset="glass"
      title="Anchored Documentation Help"
      widget-id="examples-anchor"
    />
  </main>
</template>

<script setup lang="ts">
import { MessageSquare, Search } from "lucide-vue-next";
import { Context7Widget } from "@desource/context7-widget-vue";

const modalScript = `<button id="docs-help">Open modal help</button>

<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-custom-trigger="#docs-help"
  data-hide-default-button="true"
  data-position="modal"
  data-preset="terminal"
  data-backdrop="true"
  data-close-on-outside-click="true"
></scr` + `ipt>`;

const anchorVue = `<button id="docs-trigger">Ask docs</button>

<Context7Widget
  library="/owner/repo"
  custom-trigger="#docs-trigger"
  hide-default-button
  position="anchor"
  anchor-placement="bottom-end"
  preset="glass"
  panel-height="420px"
  panel-width="420px"
/>`;

const cornerScript = `<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-preset="minimal"
  data-position="bottom-right"
  data-placeholder="Ask about the docs..."
></scr` + `ipt>`;

const presetColorFallback = `<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-preset="neo"
></scr` + `ipt>

<!-- data-color is omitted, so neo owns the button color. -->`;

const cssOverrides = `context7-widget {
  --c7-accent: #ff6f91;
  --c7-panel-radius: 8px;
  --c7-launcher-radius: 8px;
}

context7-widget::part(send-button) {
  min-width: 5rem;
}`;

const coreHelper = `import { mountContext7Widget } from "@desource/context7-widget";

mountContext7Widget({
  library: "/owner/repo",
  position: "center",
  preset: "neo",
  backdrop: true,
  closeOnOutsideClick: true,
  launcherVariant: "pill",
  launcherLabel: "Ask docs"
});`;

const vueComposable = `const docs = useContext7Widget({
  autoMount: true,
  library: "/owner/repo",
  widgetId: "docs",
  preset: "minimal"
});

await docs.send("Show installation examples");`;

const presetCards = [
  { copy: "Quiet product UI with low visual noise.", name: "minimal" },
  { copy: "Layered translucent surface for rich demos.", name: "glass" },
  { copy: "Hard-edged playful docs widget.", name: "neo" },
  { copy: "Monospace assistant for dev-tool pages.", name: "terminal" },
  { copy: "High-contrast editorial surface.", name: "brutalist" }
];

const events = [
  { copy: "Widget instance is mounted and ready for imperative calls.", name: "ready" },
  { copy: "Question text is available before the network request streams.", name: "question" },
  { copy: "First visible response token arrived; useful for latency metrics.", name: "first-token" },
  { copy: "Documentation search was invoked by the Context7 backend.", name: "tool-call" },
  { copy: "The final assistant message is available for analytics.", name: "answer-complete" },
  { copy: "Transport or configuration failures can be logged.", name: "error" }
];
</script>
