<template>
  <main class="customization-page">
    <section class="examples-hero examples-hero--with-scan customization-hero">
      <GridScan
        class="examples-hero__background"
        lines-color="#5a5736"
        scan-color="#ffb45e"
        line-style="solid"
        scan-direction="pingpong"
        :bloom-intensity="0.32"
        :bloom-smoothing="0.36"
        :bloom-threshold="0.05"
        :chromatic-aberration="0.0015"
        :grid-scale="0.09"
        :line-jitter="0.04"
        :line-thickness="1.12"
        :noise-intensity="0.012"
        :scan-delay="1"
        :scan-duration="3.3"
        :scan-glow="0.86"
        :scan-on-click="true"
        :scan-opacity="0.74"
        :scan-phase-taper="0.38"
        :scan-softness="1.6"
        :sensitivity="0.38"
      />
      <SiteHeader
        :items="[
          { href: '/', label: 'Home' },
          { href: '/examples', label: 'Examples' },
          { href: '#variables', label: 'Variables' },
          { href: '#parts', label: 'Parts' }
        ]"
      />

      <div class="examples-hero__content customization-hero__content">
        <p class="eyebrow">Styling contract</p>
        <h1>Make the widget look owned.</h1>
        <p>
          Start with a preset, map your product colors and radius to stable variables, then polish exact blocks with
          shadow parts.
        </p>
        <div class="hero__actions customization-hero__actions">
          <a class="button button--primary" href="#variables">
            <Palette :size="18" aria-hidden="true" />
            CSS variables
          </a>
          <a class="button button--ghost" href="#parts">
            <Layers :size="18" aria-hidden="true" />
            Shadow parts
          </a>
        </div>
      </div>

      <div class="customization-hero__preview" aria-label="Widget customization preview">
        <div class="style-receipt">
          <span>product tokens</span>
          <strong>#7cffb2</strong>
          <strong>8px radius</strong>
          <strong>Inter</strong>
        </div>
        <div class="style-widget">
          <div class="style-widget__header">Context7 Docs</div>
          <div class="style-widget__body">
            <span>Matches the shell.</span>
            <span>Uses your trigger.</span>
          </div>
          <div class="style-widget__input">Ask about setup...</div>
        </div>
        <div class="style-parts">
          <span>::part(panel)</span>
          <span>::part(send-button)</span>
          <span>::part(launcher)</span>
        </div>
      </div>
    </section>

    <section class="examples-section customization-section">
      <div class="section-heading">
        <p class="eyebrow">Start here</p>
        <h2>Style the stable surface, not internal markup.</h2>
      </div>

      <div class="customization-playbook">
        <article v-for="step in playbookSteps" :key="step.title">
          <component :is="step.icon" :size="22" aria-hidden="true" />
          <h3>{{ step.title }}</h3>
          <p>{{ step.copy }}</p>
        </article>
      </div>
    </section>

    <section id="variables" class="examples-section customization-section">
      <div class="section-heading">
        <p class="eyebrow">CSS variables</p>
        <h2>Override tokens without reaching into the widget.</h2>
        <p>
          Set these on `context7-widget`, on a scoped instance such as `context7-widget[widget-id="docs"]`, or inside
          theme and preset selectors. Use them for brand color, radius, surfaces, message bubbles, controls, and layout
          dimensions.
        </p>
      </div>

      <div class="token-grid">
        <article v-for="group in tokenGroups" :key="group.title" class="token-card">
          <h3>{{ group.title }}</h3>
          <p>{{ group.copy }}</p>
          <ul>
            <li v-for="token in group.tokens" :key="token">
              <code>{{ token }}</code>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section id="parts" class="examples-section customization-section">
      <div class="section-heading">
        <p class="eyebrow">Shadow parts</p>
        <h2>Target exact blocks when variables are not enough.</h2>
        <p>
          Use `::part(...)` when a product system needs direct styling for one stable surface. Prefer variables for
          colors, radius, spacing, and typography; use parts for borders, shadows, text transform, and focused polish.
        </p>
      </div>

      <div class="parts-grid">
        <article v-for="part in shadowParts" :key="part.name">
          <code>{{ part.name }}</code>
          <p>{{ part.copy }}</p>
        </article>
      </div>
    </section>

    <section class="examples-section customization-section">
      <div class="section-heading">
        <p class="eyebrow">CSS recipes</p>
        <h2>Copy a starting point, then replace the tokens.</h2>
      </div>

      <div class="recipe-grid recipe-grid--expanded">
        <CodeBlock id="customization-brand-code" label="Brand token override" :code="brandTokenSnippet" />
        <CodeBlock id="customization-theme-code" label="Scoped dark theme" :code="darkThemeSnippet" />
        <CodeBlock id="customization-density-code" label="Dense product panel" :code="densePanelSnippet" />
        <CodeBlock id="customization-parts-code" label="Shadow part polish" :code="partOverrideSnippet" />
        <CodeBlock id="customization-vue-trigger-code" label="Vue managed trigger" :code="vueTriggerSnippet" />
        <CodeBlock id="customization-center-code" label="Centered dialog surface" :code="centerDialogSnippet" />
      </div>
    </section>

    <section class="examples-section customization-section">
      <div class="customization-callout">
        <div>
          <p class="eyebrow">Public styling contract</p>
          <h2>Variables are the contract. Parts are the precision tool.</h2>
        </div>
        <p>
          Avoid styling `.c7-*` classes inside the shadow DOM. They are implementation details. The variables and
          `::part` names documented here are the stable customization layer.
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Layers, Palette, ShieldCheck, Sparkles } from 'lucide-vue-next';

const playbookSteps = [
  {
    copy: 'Choose `minimal`, `glass`, `neo`, `terminal`, or `brutalist` as the starting visual language.',
    icon: Sparkles,
    title: 'Start with a preset'
  },
  {
    copy: 'Map product tokens to `--c7-*` variables on the widget host or on one `widget-id` scoped instance.',
    icon: Palette,
    title: 'Apply brand tokens'
  },
  {
    copy: 'Use `::part` selectors for direct styling of the panel, launcher, composer, messages, and tool blocks.',
    icon: Layers,
    title: 'Polish stable parts'
  },
  {
    copy: 'Keep internal `.c7-*` selectors out of app CSS. They can change without breaking the public contract.',
    icon: ShieldCheck,
    title: 'Stay on the public surface'
  }
];

const tokenGroups = [
  {
    copy: 'Brand color, contrast, text stack, muted text, and focus halo.',
    title: 'Brand and type',
    tokens: ['--c7-accent', '--c7-accent-contrast', '--c7-font-family', '--c7-muted-color', '--c7-focus-ring']
  },
  {
    copy: 'The main dialog surface, dimensions, border, radius, shadow, spacing, and stacking level.',
    title: 'Panel shell',
    tokens: [
      '--c7-panel-background',
      '--c7-panel-backdrop-filter',
      '--c7-panel-color',
      '--c7-panel-width',
      '--c7-panel-height',
      '--c7-panel-radius',
      '--c7-panel-shadow',
      '--c7-border-color',
      '--c7-spacing',
      '--c7-z-index'
    ]
  },
  {
    copy: 'The built-in fixed launcher button. Ignored when a custom trigger replaces it.',
    title: 'Launcher',
    tokens: [
      '--c7-launcher-background',
      '--c7-launcher-color',
      '--c7-launcher-gap',
      '--c7-launcher-radius',
      '--c7-launcher-shadow',
      '--c7-launcher-size'
    ]
  },
  {
    copy: 'The modal/backdrop layer used by centered flows and any explicit backdrop-enabled widget.',
    title: 'Backdrop',
    tokens: ['--c7-backdrop', '--c7-backdrop-filter']
  },
  {
    copy: 'Top and bottom panel chrome.',
    title: 'Header and footer',
    tokens: ['--c7-header-background', '--c7-footer-background']
  },
  {
    copy: 'Assistant, user, and error bubbles.',
    title: 'Messages',
    tokens: [
      '--c7-message-assistant-background',
      '--c7-message-assistant-color',
      '--c7-message-user-background',
      '--c7-message-user-color',
      '--c7-message-radius',
      '--c7-error-background',
      '--c7-error-color'
    ]
  },
  {
    copy: 'Input and send control tokens.',
    title: 'Controls',
    tokens: ['--c7-control-background', '--c7-control-border', '--c7-control-color']
  },
  {
    copy: 'Only applies to the Vue package managed trigger after importing `@desource/context7-widget-vue/styles.css`.',
    title: 'Vue managed trigger',
    tokens: [
      '--c7-vue-trigger-background',
      '--c7-vue-trigger-border',
      '--c7-vue-trigger-color',
      '--c7-vue-trigger-focus',
      '--c7-vue-trigger-radius',
      '--c7-vue-trigger-shadow'
    ]
  }
];

const shadowParts = [
  { copy: 'Backdrop overlay behind the panel.', name: 'backdrop' },
  { copy: 'Main dialog/popover surface.', name: 'panel' },
  { copy: 'Header bar containing title and close button.', name: 'header' },
  { copy: 'Widget title text.', name: 'title' },
  { copy: 'Close icon button.', name: 'close-button' },
  { copy: 'Scrollable message list.', name: 'messages' },
  { copy: 'Any message bubble.', name: 'message' },
  { copy: 'Assistant message bubble.', name: 'assistant-message' },
  { copy: 'User message bubble.', name: 'user-message' },
  { copy: 'Error message bubble.', name: 'error-message' },
  { copy: 'Typing indicator bubble.', name: 'typing' },
  { copy: 'Backend tool-call container.', name: 'tool-call' },
  { copy: 'Button that expands tool results.', name: 'tool-toggle' },
  { copy: 'Markdown code block inside answers.', name: 'code-block' },
  { copy: 'Composer form area.', name: 'composer' },
  { copy: 'Question input.', name: 'input' },
  { copy: 'Submit button.', name: 'send-button' },
  { copy: 'Powered-by footer container.', name: 'footer' },
  { copy: 'Powered-by Context7 link.', name: 'powered-by' },
  { copy: 'Built-in floating launcher.', name: 'launcher' }
];

const brandTokenSnippet = `context7-widget[widget-id="docs"] {
  --c7-accent: #7cffb2;
  --c7-accent-contrast: #07120c;
  --c7-font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  --c7-panel-background: #101513;
  --c7-panel-color: #f7f2e8;
  --c7-border-color: rgba(247, 242, 232, 0.18);
  --c7-muted-color: rgba(247, 242, 232, 0.66);
}`;

const darkThemeSnippet = `context7-widget[widget-id="docs"][theme="dark"] {
  --c7-panel-background: #070b09;
  --c7-header-background: #0c120f;
  --c7-footer-background: #0c120f;
  --c7-control-background: #101513;
  --c7-control-border: rgba(247, 242, 232, 0.18);
  --c7-control-color: #f7f2e8;
}

@media (prefers-color-scheme: dark) {
  context7-widget[widget-id="docs"][theme="auto"] {
    --c7-panel-background: #070b09;
    --c7-header-background: #0c120f;
    --c7-footer-background: #0c120f;
    --c7-control-background: #101513;
    --c7-control-border: rgba(247, 242, 232, 0.18);
    --c7-control-color: #f7f2e8;
  }
}`;

const densePanelSnippet = `context7-widget[widget-id="dashboard-docs"] {
  --c7-panel-width: min(420px, calc(100vw - 24px));
  --c7-panel-height: min(540px, calc(100vh - 96px));
  --c7-panel-radius: 8px;
  --c7-message-radius: 8px;
  --c7-spacing: 12px;
  --c7-launcher-size: 46px;
}`;

const partOverrideSnippet = `context7-widget::part(panel) {
  border-width: 1px;
}

context7-widget::part(title) {
  font-size: 0.875rem;
  letter-spacing: 0;
}

context7-widget::part(send-button) {
  min-width: 5rem;
  text-transform: uppercase;
}

context7-widget::part(code-block) {
  border: 1px solid rgba(255, 255, 255, 0.12);
}`;

const vueTriggerSnippet = `@import "@desource/context7-widget-vue/styles.css";

.context7-widget-trigger {
  --c7-vue-trigger-background: #111827;
  --c7-vue-trigger-color: #f8fafc;
  --c7-vue-trigger-radius: 8px;
  --c7-vue-trigger-shadow: none;
}`;

const centerDialogSnippet = `context7-widget[position="center"] {
  --c7-backdrop: rgba(2, 6, 23, 0.68);
  --c7-backdrop-filter: blur(10px);
  --c7-panel-width: min(720px, calc(100vw - 32px));
  --c7-panel-height: min(680px, calc(100vh - 32px));
  --c7-panel-radius: 12px;
  --c7-panel-shadow: 0 32px 120px rgba(0, 0, 0, 0.36);
}`;
</script>
