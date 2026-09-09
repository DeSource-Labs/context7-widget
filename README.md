# Context7 Widget

[![Core](https://img.shields.io/npm/v/@desource/context7-widget?color=blue&logo=typescript)](https://www.npmjs.com/package/@desource/context7-widget)
[![Vue](https://img.shields.io/npm/v/@desource/context7-widget-vue?color=blue&logo=vue.js)](https://www.npmjs.com/package/@desource/context7-widget-vue)
[![Nuxt](https://img.shields.io/npm/v/@desource/context7-widget-nuxt?color=blue&logo=nuxt)](https://www.npmjs.com/package/@desource/context7-widget-nuxt)
[![React](https://img.shields.io/npm/v/@desource/context7-widget-react?color=blue&logo=react)](https://www.npmjs.com/package/@desource/context7-widget-react)
[![Svelte](https://img.shields.io/npm/v/@desource/context7-widget-svelte?color=blue&logo=svelte)](https://www.npmjs.com/package/@desource/context7-widget-svelte)
[![Angular](https://img.shields.io/npm/v/@desource/context7-widget-angular?color=blue&logo=angular&logoColor=white)](https://www.npmjs.com/package/@desource/context7-widget-angular)
<br />
[![Coverage](https://codecov.io/gh/DeSource-Labs/context7-widget/branch/main/graph/badge.svg)](https://codecov.io/gh/DeSource-Labs/context7-widget)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=DeSource-Labs_context7-widget&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DeSource-Labs_context7-widget)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/DeSource-Labs/context7-widget/blob/main/LICENSE)

Context7 AI docs chat that belongs on your site.

An open-source upgrade to the official Context7 widget. Match your fonts,
colors, buttons, and layout, with a more comfortable chat experience for the
people exploring your product. Use a script tag or a native framework package.

[Try the widget](https://context7.desourcelabs.com/examples) ·
[Explore the styling](https://context7.desourcelabs.com/customization) ·
[Replace your existing script](#existing-context7-widget-user)

## What This Solves

You have put care into your website. The typography, spacing, buttons, and dark
mode all belong together. Then you add a docs widget, and it looks like it came
from another site.

Context7 provides a free AI docs widget for library owners, including the hosted
search and answers. It searches your library’s documentation to help visitors
understand and use your product. The official widget offers basic color,
placement, and text options. Matching a carefully designed product takes more
control over the interface and how people use it.

We built Context7 Widget to close that gap. Keep Context7’s documentation answers
and make the chat part of your design: your fonts, your colors, your help button,
and a panel that fits the page. Add the details people notice while using it:
copyable code, multiline questions, Stop and Retry controls, and scrolling that
lets them finish reading.

If you already use the Context7 widget, upgrade by replacing one script URL.
Your library and allowed-domain settings carry over. Then choose a preset and
adapt it to your site.

For teams new to Context7, docs chat gives visitors a way to ask whether your
library fits their project, find an integration example, and get started while
they are still on your site. Put it on your product pages and in onboarding so
people can move from interest to trying the product.

This project builds on Context7’s free widget initiative. The interface is also
free to use and adapt under [MIT](./LICENSE), including in commercial products.
Built independently by DeSource Labs, with documentation search and AI answers
provided by Context7.

## Choose Your Integration

| Integration                                               | Use it when                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `https://context7.desourcelabs.com/widget.js`             | You want a drop-in script tag for HTML, Docusaurus, Next.js, Astro, Nuxt, Vite, or static pages  |
| [`@desource/context7-widget`](./packages/core)            | You want TypeScript helpers, the custom element, script generation, or direct runtime control    |
| [`@desource/context7-widget-vue`](./packages/vue)         | You want a Vue 3 component, composable, plugin helper, typed events, and managed triggers        |
| [`@desource/context7-widget-nuxt`](./packages/nuxt)       | You want Nuxt auto-imports, global defaults, automatic CSS, and SSR-safe Vue integration         |
| [`@desource/context7-widget-react`](./packages/react)     | You want a native React component, controlled state, hook, typed callbacks, and managed triggers |
| [`@desource/context7-widget-svelte`](./packages/svelte)   | You want a native Svelte 5 component, bindable state, snippets, and reactive controls            |
| [`@desource/context7-widget-angular`](./packages/angular) | You want a standalone Angular component, signals, DI defaults, and injectable controls           |

Vue, React, Svelte, and Angular own native framework UI and lifecycle while
sharing the headless conversation engine, renderer bridge, transport, Markdown,
types, defaults, and brand assets through `@desource/context7-widget/kit`. The
Nuxt module configures the Vue package without adding another renderer.

## Before You Start

Use a library you have claimed on Context7. In its **Admin → Chat** settings,
enable the widget, add your site's domain to the allowed domains, and save.
Replace `/owner/repo` in the examples with that library's id. A library being
indexed alone does not enable chat on your site.
See [Context7's widget setup](https://context7.com/docs/howto/chat-widget).

## Quick Start

Add the script below, or use it to replace your existing Context7 script. Keep your `data-library`:

```html
<script async src="https://context7.desourcelabs.com/widget.js" data-library="/owner/repo"></script>
```

Choose a preset, theme, and position to start matching your site:

```html
<script
  async
  src="https://context7.desourcelabs.com/widget.js"
  data-library="/owner/repo"
  data-position="anchor"
  data-preset="glass"
  data-theme="auto"
  data-placeholder="Ask about setup, API usage, or examples..."
></script>
```

Context7 continues to handle documentation search and AI answers. Chat requests
go directly to `https://context7.com/api/v2/widget/chat`.

## Data Flow And Privacy

Chat requests travel directly from the visitor's browser to Context7. The JSON
request contains the configured library id and the current conversation
messages, including each message's id, role, and content. DeSource Labs serves
the optional hosted `widget.js` file but does not proxy chat requests.

The client adds no analytics, cookies, or persistent browser storage;
conversation state is held only in the live widget's memory, and `reset()`
clears it. Host applications can listen to events containing questions and
answers, so only forward those payloads to analytics under your own privacy
policy. Do not put secrets or sensitive personal data into chat, and review
Context7's terms for backend processing and retention.

## Choose A Path

### Existing Context7 widget user

Upgrade the widget by changing the script URL below. Keep your `data-library`,
allowed domains, and existing supported `data-*` options. Add a preset, custom
trigger, or CSS overrides when you are ready to style it.

```html
<!-- Before -->
<script async src="https://context7.com/widget.js" data-library="/owner/repo"></script>

<!-- After -->
<script async src="https://context7.desourcelabs.com/widget.js" data-library="/owner/repo"></script>
```

### Product or docs team new to Context7

Give visitors answers while they are deciding whether to use your product.
Context7 uses your documentation to explain setup and API usage; this widget
puts that help inside the site you have already designed.

1. Claim your library, enable its widget, and save your allowed domains in Context7.
2. Put the widget script in the root layout of your docs or product site.
3. Choose a preset and position.
4. Add CSS variables or `::part()` overrides so the chat matches your UI.
5. Listen to events such as `c7:question` and `c7:answer-complete` for product
   analytics.

### Vue application

```bash
npm install @desource/context7-widget-vue
```

```vue
<script setup lang="ts">
import { Context7Widget, type Context7WidgetQuestionEventDetail } from '@desource/context7-widget-vue';
import '@desource/context7-widget-vue/styles.css';

function trackQuestion(detail: Context7WidgetQuestionEventDetail) {
  console.log(detail.library, detail.question);
}
</script>

<template>
  <Context7Widget library="/owner/repo" position="anchor" preset="glass" theme="auto" @question="trackQuestion" />
</template>
```

### TypeScript application

```bash
npm install @desource/context7-widget
```

```ts
import { mountContext7Widget } from '@desource/context7-widget';

mountContext7Widget({
  library: '/owner/repo',
  position: 'center',
  preset: 'glass',
  backdrop: true,
  closeOnOutsideClick: true
});
```

### React application

```bash
npm install @desource/context7-widget-react
```

```tsx
import { Context7Widget } from '@desource/context7-widget-react/component';
import '@desource/context7-widget-react/styles.css';

export function DocsAssistant() {
  return <Context7Widget library="/owner/repo" position="anchor" preset="glass" customTrigger />;
}
```

### Nuxt application

```bash
npm install @desource/context7-widget-nuxt
```

```ts
export default defineNuxtConfig({
  modules: ['@desource/context7-widget-nuxt'],
  context7Widget: {
    defaults: { library: '/owner/repo', preset: 'glass' }
  }
});
```

`<Context7Widget />` and `useContext7Widget()` are then auto-imported.

### Svelte application

```bash
npm install @desource/context7-widget-svelte
```

```svelte
<script lang="ts">
  import { Context7Widget } from '@desource/context7-widget-svelte';
  import '@desource/context7-widget-svelte/styles.css';

  let open = $state(false);
</script>

<Context7Widget bind:open library="/owner/repo" position="anchor" preset="glass" customTrigger />
```

### Angular application

```bash
npm install @desource/context7-widget-angular
```

```ts
import { Component } from '@angular/core';
import { Context7Widget } from '@desource/context7-widget-angular';

@Component({
  standalone: true,
  imports: [Context7Widget],
  template: '<context7-widget library="/owner/repo" position="anchor" preset="glass" [customTrigger]="true" />'
})
export class DocsAssistant {}
```

Import `@desource/context7-widget-angular/styles.css` once in the application stylesheet or build configuration.

## Feature Highlights

- Match your brand with six presets, light/dark themes, fonts, colors, spacing,
  and public CSS variables and parts.
- Open chat from your own help button, anchor it beside a trigger, or use a corner
  panel or centered dialog.
- Let people paste multiline questions, copy answers and code, stop a response,
  and retry a failed request. Partial answers survive cancellation.
- Keep reading without being pulled to the latest token. Scrolling follows new
  output only while the reader stays near the bottom.
- Translate visible and assistive text, and use keyboard-accessible dialogs with
  focus containment, background isolation, and mobile safe-area support.
- Render formatted answers with tables, lists, links, and highlighted code.
  Streaming updates run once per animation frame; Markdown parsing waits until
  completion or cancellation.
- Connect questions, answers, and lifecycle events to your own analytics with
  typed callbacks or events.
- Use native Vue, React, Svelte, or Angular components, or the Nuxt 3/4 module.
  All packages share the conversation engine, transport, Markdown, and styles.

## Customization

Start with a preset, then match the details that make your site recognizable.
The core widget uses Shadow DOM and supports styling from your own CSS:

- CSS variables on `context7-widget`
- `::part(...)` selectors for stable internal blocks
- `widget-id` for per-instance scoping
- presets as a starting point, not a design limit

```css
context7-widget[widget-id='docs'] {
  --c7-accent: #7cffb2;
  --c7-accent-contrast: #07120c;
  --c7-font-family: Inter, ui-sans-serif, system-ui, sans-serif;
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

Native Vue, React, Svelte, and Angular packages render light DOM. Apply the
same variables to `.context7-widget`; their package guides document the
framework-specific trigger selector and customization examples.

See the [live customization guide](https://context7.desourcelabs.com/customization)
and [integration examples](https://context7.desourcelabs.com/examples).

## Public Options

JavaScript option names are listed below. Script attributes use `data-` and
kebab case, such as `data-close-on-outside-click`; `labels` is a JavaScript
property. See the [core option table](./packages/core#options) for the mapping.

- `library`
- `theme`
- `preset`
- `position`
- `color`
- `customTrigger`
- `backdrop`
- `closeOnOutsideClick`
- `defaultOpen`
- `initialMessage`
- `labels`
- `launcherLabel`
- `launcherVariant`
- `linkBaseUrl`
- `panelHeight`
- `panelWidth`
- `placeholder`
- `title`
- `widgetId`

## Events

The core custom element dispatches composed DOM events. Native framework
packages expose callbacks, emits, or outputs documented in their package guides:

- `c7:ready`
- `c7:open`
- `c7:close`
- `c7:cancel`
- `c7:question`
- `c7:first-token`
- `c7:answer`
- `c7:answer-complete`
- `c7:tool-call`
- `c7:tool-result`
- `c7:error`

Cancelling after answer tokens arrive preserves the visible partial assistant
message in `getMessages()` with `status: 'cancelled'`.

Example:

```js
document.addEventListener('c7:question', (event) => {
  analytics.track('Docs question', {
    library: event.detail.library,
    question: event.detail.question,
    widgetId: event.detail.widgetId
  });
});
```

## Documentation

- [Core package](./packages/core)
- [Vue package](./packages/vue)
- [Nuxt package](./packages/nuxt)
- [React package](./packages/react)
- [Svelte package](./packages/svelte)
- [Angular package](./packages/angular)
- [Integration recipes](./docs/INTEGRATION.md)
- [Architecture notes](./docs/ARCHITECTURE.md)
- [Contributing guide](./CONTRIBUTING.md)
- [Release process](./RELEASE.md)
- [Security policy](./SECURITY.md)

## Local Development

```bash
pnpm install
pnpm lint
pnpm build
pnpm test:unit
pnpm test:e2e
pnpm dev:prepare
pnpm dev:demo
```

The packages use framework-appropriate production builders. The demo site
builds every package, copies `packages/core/dist/widget.js` into
`demo/public/widget.js`, then runs Nuxt.

The manually dispatched CI workflow and mandatory release gate enforce coverage
floors, production dependency and peer checks, package metadata/type
validation, SSR imports, and gzip budgets for the hosted widget and real
tree-shaken consumers of core, `/core`, `/kit`, every framework package, and
their stylesheets. Core, Vue, React, Svelte, and Angular run the same behavior
suite in desktop Chromium, Firefox, WebKit, and mobile WebKit profiles; Nuxt
adds module fixtures covering SSR, generated types, and disabled integrations.

## Maintenance

The scheduled scanner downloads `https://context7.com/widget.js`, stores a raw
snapshot, normalized copy, metadata, and SHA-256 hash under `upstream/`, then
opens a GitHub issue when the official script changes.

That scanner watches client-script drift. Runtime answers still depend on the
Context7 hosted backend, so manual smoke testing remains part of release work.

## Release

This repo uses Changesets for npm releases. Public package changes should
include:

```bash
pnpm changeset
```

Maintainers publish through the workflow documented in [RELEASE.md](./RELEASE.md).
