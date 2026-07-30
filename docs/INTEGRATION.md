# Integration Guide

This guide is for teams that want an AI documentation assistant on a site, but
do not want a generic widget that clashes with the product.

Context7 provides the hosted documentation backend and grounded answers. This
repo provides the customizable client layer: script replacement, custom element,
TypeScript helpers, Vue bindings, styling contract, event stream, and
positioning modes.

## Which Integration Should I Use?

| Project type                           | Recommended path                                      |
| -------------------------------------- | ----------------------------------------------------- |
| Existing Context7 script install       | Replace only the script URL                           |
| Static docs or marketing page          | Use `/widget.js`                                      |
| Docusaurus, Astro, Next.js, Nuxt, Vite | Use `/widget.js` in the root layout                   |
| Product app with custom controls       | Use `@desource/context7-widget`                       |
| Vue 3 app                              | Use `@desource/context7-widget-vue`                   |
| Nuxt, React, Svelte, Angular app later | Use script/core today; dedicated packages are planned |

## Drop-In Replacement

Official Context7:

```html
<script async src="https://context7.com/widget.js" data-library="/owner/repo"></script>
```

Customizable replacement:

```html
<script async src="https://context7.desource-labs.org/widget.js" data-library="/owner/repo"></script>
```

Keep your Context7 library and allowed-domain configuration unchanged. Chat
requests still go to `https://context7.com`.

## Branded Script Install

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-position="anchor"
  data-preset="glass"
  data-theme="auto"
  data-placeholder="Ask about setup, API usage, or examples..."
></script>
```

Omit `data-color` when you want the selected preset to own the action color. Set
`data-color` only for a brand override.

## Custom Trigger

Use a custom trigger when the assistant belongs to an existing button, command
menu, help item, or navigation action.

```html
<button id="docs-chat">Ask docs</button>

<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-custom-trigger="#docs-chat"
  data-position="anchor"
  data-preset="minimal"
></script>
```

With `position="anchor"`, the panel opens above the trigger when there is enough
space and below it otherwise.

## Centered Help Dialog

Use `center` when the user intentionally asks for help, for example from an
onboarding flow, command palette, empty state, or support menu.

```html
<button id="docs-help">Open docs help</button>

<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-custom-trigger="#docs-help"
  data-position="center"
  data-preset="terminal"
  data-backdrop="true"
  data-close-on-outside-click="true"
></script>
```

## Core TypeScript

```bash
pnpm add @desource/context7-widget
```

```ts
import { defineContext7Widget, mountContext7Widget, buildContext7WidgetScriptTag } from '@desource/context7-widget';

defineContext7Widget();

mountContext7Widget({
  library: '/owner/repo',
  theme: 'auto',
  position: 'center',
  preset: 'glass',
  backdrop: true,
  closeOnOutsideClick: true
});

const script = buildContext7WidgetScriptTag({
  library: '/owner/repo',
  customTrigger: '#docs-chat',
  position: 'anchor'
});
```

## Vue

```bash
pnpm add @desource/context7-widget-vue
```

```vue
<script setup lang="ts">
import { Context7Widget, type Context7WidgetQuestionEventDetail } from '@desource/context7-widget-vue';
import '@desource/context7-widget-vue/styles.css';

function trackQuestion(detail: Context7WidgetQuestionEventDetail) {
  analytics.track('Docs question', {
    library: detail.library,
    question: detail.question
  });
}
</script>

<template>
  <Context7Widget
    library="/owner/repo"
    position="anchor"
    preset="glass"
    custom-trigger
    launcher-label="Ask docs"
    @question="trackQuestion"
  />
</template>
```

Composable:

```ts
import { useContext7Widget } from '@desource/context7-widget-vue';

const docs = useContext7Widget({
  autoMount: true,
  library: '/owner/repo',
  widgetId: 'docs'
});

docs.open();
await docs.send('Show setup examples');
console.log(docs.isBusy.value, docs.messages.value);
docs.cancel();
docs.reset();
```

## Next.js App Router

Add the script in `app/layout.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://context7.desource-labs.org/widget.js"
          data-library="/owner/repo"
          data-preset="minimal"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

## Docusaurus

Add the script in `docusaurus.config.js`:

```js
export default {
  scripts: [
    {
      src: 'https://context7.desource-labs.org/widget.js',
      async: true,
      'data-library': '/owner/repo',
      'data-preset': 'minimal'
    }
  ]
};
```

## Styling

Use presets for a starting point, then override public CSS variables:

```css
context7-widget[widget-id='docs'] {
  --c7-accent: #7cffb2;
  --c7-panel-background: #101513;
  --c7-panel-color: #f7f2e8;
  --c7-border-color: rgba(247, 242, 232, 0.18);
  --c7-panel-radius: 8px;
}

context7-widget::part(send-button) {
  min-width: 5rem;
  text-transform: uppercase;
}
```

Do not target internal `.c7-*` classes. They are implementation details. In
Vue, apply the same CSS variables to `.context7-widget`; shadow parts apply only
to the core custom element.

Vue’s `part` attributes remain stable light-DOM selectors and can be targeted as
`[part~='send-button']`; they are not shadow-DOM `::part()` exports.

## Analytics

```js
document.addEventListener('c7:question', (event) => {
  analytics.track('Docs question', {
    library: event.detail.library,
    question: event.detail.question,
    widgetId: event.detail.widgetId
  });
});

document.addEventListener('c7:answer-complete', (event) => {
  analytics.track('Docs answer complete', {
    answerLength: event.detail.answer.length,
    library: event.detail.library,
    widgetId: event.detail.widgetId
  });
});
```

## CSP

For the hosted script and default Context7 backend:

```http
Content-Security-Policy:
  script-src 'self' https://context7.desource-labs.org;
  connect-src 'self' https://context7.com;
  img-src 'self' data:;
```

If you host `widget.js` elsewhere, add that script origin. Keep
`https://context7.com` in `connect-src` because chat requests use the Context7
backend. The embedded DeSource Labs mark uses a data URL, hence `img-src data:`.

Modern browsers use a shared constructable stylesheet. Browsers that need the
inline `<style>` fallback also require a `style-src` policy that permits that
fallback. Do not copy this abbreviated example blindly into an existing policy:
merge these sources into your application’s nonce/hash-based policy and verify
the resulting page in every supported browser.
