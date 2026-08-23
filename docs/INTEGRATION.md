# Integration Guide

This guide is for teams that want an AI documentation assistant on a site, but
do not want a generic widget that clashes with the product.

Context7 provides the hosted documentation backend and grounded answers. This
repo provides the customizable client layer: script replacement, custom
element, TypeScript helpers, native Vue and React bindings, styling contract,
event stream, and positioning modes.

## Which Integration Should I Use?

| Project type                           | Recommended path                                      |
| -------------------------------------- | ----------------------------------------------------- |
| Existing Context7 script install       | Replace only the script URL                           |
| Static docs or marketing page          | Use `/widget.js`                                      |
| Docusaurus, Astro, Next.js, Nuxt, Vite | Use `/widget.js` in the root layout                   |
| Product app with custom controls       | Use `@desource/context7-widget`                       |
| Vue 3 app                              | Use `@desource/context7-widget-vue`                   |
| React app                              | Use `@desource/context7-widget-react`                 |
| Svelte or Angular app                  | Use script/core today; dedicated packages are planned |

## Data Flow And Privacy

All package surfaces use the same browser transport. When a visitor sends a
question, the browser posts the configured `libraryName` and the current
conversation messages to `https://context7.com/api/v2/widget/chat`. Each
message includes its id, role, content, and an equivalent text part. Theme,
preset, position, `widgetId`, and other presentation options are not included
in the chat request.

The request does not pass through DeSource Labs. Loading the optional hosted
script is a separate file request to `context7.desource-labs.org`; npm package
users do not make that request. The widget itself adds no analytics, cookies,
`localStorage`, or `sessionStorage`, and keeps the conversation in memory until
the widget is released; `reset()` clears it explicitly.

Questions and answers are exposed in public widget events. If the host
application forwards those events to analytics, logging, or support systems,
that is a separate application-controlled data flow. Avoid submitting secrets
or sensitive personal data and consult Context7's terms and privacy practices
for backend processing and retention.

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

With `position="anchor"`, the panel opens above the trigger by default and flips
below when the upper side cannot fit it. When neither side can fit the requested
height, it uses the roomier side. The panel's height and width are constrained
to the visible viewport, including mobile browser and on-screen-keyboard
viewport changes.

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
npm install @desource/context7-widget
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
npm install @desource/context7-widget-vue
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
await docs.retry();
docs.reset();
```

For parent-owned visibility, use Vue's controlled API:

```vue
<Context7Widget v-model:open="docsOpen" library="/owner/repo" />
```

## React

```bash
npm install @desource/context7-widget-react
```

```tsx
import { useState } from 'react';
import { Context7Widget } from '@desource/context7-widget-react/component';
import '@desource/context7-widget-react/styles.css';

export function DocsAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <Context7Widget
      library="/owner/repo"
      open={open}
      onOpenChange={setOpen}
      position="anchor"
      preset="glass"
      customTrigger
      onQuestion={(detail) => analytics.track('Docs question', detail)}
    />
  );
}
```

Hook-owned programmatic widget:

```tsx
import { useContext7Widget } from '@desource/context7-widget-react/hook';

const docs = useContext7Widget({
  autoMount: true,
  library: '/owner/repo',
  widgetId: 'docs'
});

await docs.send('Show setup examples');
await docs.retry();
```

Without `autoMount`, the hook resolves the newest React registration for its
`widgetId`; this is a package-level registry, not a DOM ancestry lookup. The id
defaults to `default`, and if that registration is absent the default lookup
falls back to the first available widget. If duplicate ids are intentional,
unmounting the newest registration restores the previous one.

## Next.js App Router

The native React entries preserve `"use client"`, so
`@desource/context7-widget-react/component` can establish the client boundary
when imported from an App Router tree. Alternatively, add the hosted custom
element script in `app/layout.tsx`:

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

Do not target internal `.c7-*` classes. They are implementation details. In Vue
or React, apply the same CSS variables to `.context7-widget`; shadow parts apply
only to the core custom element.

Framework `part` attributes remain stable light-DOM selectors and can be
targeted as `[part~='send-button']`; they are not shadow-DOM `::part()` exports.

## Localization, Links, And Chat UX

Core helpers, Vue, and React accept a partial `labels` object. Only supplied
keys replace the English defaults:

```ts
const labels = {
  send: 'Enviar',
  stop: 'Detener',
  retry: 'Reintentar',
  close: 'Cerrar chat',
  poweredBy: 'Con tecnología de',
  enhancedBy: 'Mejorado por',
  libraryFallback: 'esta biblioteca',
  missingLibrary: 'Falta la configuración de la biblioteca.'
};
```

The shared `Context7WidgetLabels` type is exported by the core, Vue, and React
package roots. Attribution prefixes, attribution accessibility labels, the
initial-message library fallback, and missing-library guidance use the same
dictionary as the chat controls.

Pass `linkBaseUrl="https://docs.example.com/"` when relative links in generated
Markdown should resolve to your own docs rather than the Context7 library page.
Raw HTML is escaped and only safe HTTP(S)/relative links are emitted.

The composer supports code paste and multiline questions: Enter sends and
Shift+Enter adds a newline. Streaming moves keyboard focus to Stop without
disabling the composer. Completed answers and code blocks are copyable, failed
requests are retryable, centered dialogs isolate the background, and mobile
safe-area/overscroll behavior is built in.

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
