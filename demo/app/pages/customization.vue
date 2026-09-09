<template>
  <main class="customization-page">
    <SiteHero
      eyebrow="Make it yours"
      title="Bring your design into the conversation."
      description="Bring your fonts, colors, and attention to detail into the conversation. Start with a preset, then style the panel, messages, and buttons to match your site."
      tone="amber"
      product-aria-label="Customization widget preview"
      :marquee-items="heroMarqueeItems"
      :nav-items="[
        { href: '/', label: 'Home' },
        { href: '/examples', label: 'Examples' },
        { href: '#variables', label: 'Variables' },
        { href: '#parts', label: 'Parts' }
      ]"
    >
      <template #actions>
        <a class="button button--primary" href="#variables">
          <SiteIcon name="palette" :size="18" aria-hidden="true" />
          CSS variables
        </a>
        <a class="button button--ghost" href="#parts">
          <SiteIcon name="stack" :size="18" aria-hidden="true" />
          Shadow parts
        </a>
      </template>

      <template #product>
        <HeroWidgetDialog
          class="site-hero__dialog site-hero__dialog--customization"
          placeholder="Ask about setup..."
          title="Context7 Widget Docs"
          tone="amber"
          :messages="[
            { kind: 'assistant', text: 'Use your own fonts, colors, and spacing throughout the widget.' },
            { kind: 'user', text: 'Can I style the messages and input too?' },
            {
              kind: 'assistant',
              text: 'Yes. CSS variables cover the main styles; public parts let you customize individual elements.'
            }
          ]"
        />
      </template>
    </SiteHero>

    <section class="examples-section customization-section">
      <div class="section-heading">
        <p class="eyebrow">Start here</p>
        <h2>Start with a preset, then make it yours.</h2>
      </div>

      <div class="customization-playbook">
        <article v-for="step in playbookSteps" :key="step.title">
          <SiteIcon :name="step.icon" :size="22" aria-hidden="true" />
          <h3>{{ step.title }}</h3>
          <p>{{ step.copy }}</p>
        </article>
      </div>
    </section>

    <section id="variables" class="examples-section customization-section">
      <div class="section-heading">
        <p class="eyebrow">CSS variables</p>
        <h2>Use the design choices you have already made.</h2>
        <p>
          Set these variables on <code>context7-widget</code> for core, or <code>.context7-widget</code> for a native
          framework package. Style one instance with <code>[widget-id="docs"]</code>, or use theme and preset selectors
          to refine each look.
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
        <h2>Give each detail your own treatment.</h2>
        <p>
          Style individual elements with <code>::part(...)</code> on the core custom element, or
          <code>[part~='...']</code> in native framework markup. Use these for details beyond the CSS variables, such as
          a custom border on code blocks or a different header layout.
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
        <h2>A few lines of CSS can change the whole feel.</h2>
      </div>

      <div class="recipe-grid recipe-grid--expanded">
        <CodeBlock id="customization-brand-code" label="Brand token override" :code="brandTokenSnippet" />
        <CodeBlock id="customization-theme-code" label="Scoped dark theme" :code="darkThemeSnippet" />
        <CodeBlock id="customization-density-code" label="Dense product panel" :code="densePanelSnippet" />
        <CodeBlock id="customization-parts-code" label="Style individual parts" :code="partOverrideSnippet" />
        <CodeBlock
          id="customization-framework-trigger-code"
          label="Framework managed trigger"
          :code="frameworkTriggerSnippet"
        />
        <CodeBlock id="customization-center-code" label="Centered dialog" :code="centerDialogSnippet" />
      </div>
    </section>

    <section class="examples-section customization-section">
      <div class="customization-callout">
        <div>
          <p class="eyebrow">Keep your styles maintainable</p>
          <h2>Build on the public CSS API.</h2>
        </div>
        <p>
          CSS variables, core <code>::part</code> selectors, and framework <code>[part]</code> selectors are the
          supported styling options. Avoid internal <code>.c7-*</code> classes, which can change between releases.
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const heroMarqueeItems = librariesArray.map(({ key, customizationHref, label, logo }) => ({
  key,
  href: customizationHref,
  label,
  logo
}));

const playbookSteps = [
  {
    copy: 'Choose minimal, glass, neo, terminal, or brutalist. Pick the look closest to your site and build from there.',
    icon: 'swatches',
    title: 'Start with a preset'
  },
  {
    copy: 'Connect your fonts, colors, spacing, and border radius to the widget’s CSS variables.',
    icon: 'palette',
    title: 'Bring in your design'
  },
  {
    copy: 'Style the panel, launcher, input, messages, and code blocks through their public part names.',
    icon: 'stack',
    title: 'Finish the details'
  },
  {
    copy: 'Use documented variables and parts so your styles do not depend on the widget’s internal markup.',
    icon: 'shield-check',
    title: 'Keep updates simple'
  }
];

const tokenGroups = [
  {
    copy: 'Accent color, font family, secondary text, and keyboard focus ring.',
    title: 'Brand and type',
    tokens: ['--c7-accent', '--c7-accent-contrast', '--c7-font-family', '--c7-muted-color', '--c7-focus-ring']
  },
  {
    copy: 'Panel background, size, borders, corners, shadow, spacing, and stacking order.',
    title: 'Panel',
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
    copy: 'The overlay behind a centered dialog or any widget with its backdrop enabled.',
    title: 'Backdrop',
    tokens: ['--c7-backdrop', '--c7-backdrop-filter']
  },
  {
    copy: 'Background colors for the top and bottom of the panel.',
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
    copy: 'Background, border, and text colors for the input and send button.',
    title: 'Controls',
    tokens: ['--c7-control-background', '--c7-control-border', '--c7-control-color']
  },
  {
    copy: 'Applies to managed triggers rendered by a native framework package after its stylesheet is imported.',
    title: 'Framework managed trigger',
    tokens: [
      '--c7-trigger-background',
      '--c7-trigger-border',
      '--c7-trigger-color',
      '--c7-trigger-focus',
      '--c7-trigger-radius',
      '--c7-trigger-shadow'
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
  { copy: 'Always-visible Context7 and DeSource Labs attribution.', name: 'powered-by' },
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

const frameworkTriggerSnippet = `/* Import the Vue, React, Svelte, or Angular package stylesheet first. */
.context7-widget-trigger {
  --c7-trigger-background: #111827;
  --c7-trigger-color: #f8fafc;
  --c7-trigger-radius: 8px;
  --c7-trigger-shadow: none;
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
