# Context7 Widget

[![Coverage](https://codecov.io/gh/DeSource-Labs/context7-widget/branch/main/graph/badge.svg)](https://codecov.io/gh/DeSource-Labs/context7-widget)
[![Core](https://img.shields.io/npm/v/@desource/context7-widget?logo=npm)](https://www.npmjs.com/package/@desource/context7-widget)
[![Vue](https://img.shields.io/npm/v/@desource/context7-widget-vue?logo=npm)](https://www.npmjs.com/package/@desource/context7-widget-vue)
[![Nuxt](https://img.shields.io/npm/v/@desource/context7-widget-nuxt?logo=npm)](https://www.npmjs.com/package/@desource/context7-widget-nuxt)
[![React](https://img.shields.io/npm/v/@desource/context7-widget-react?logo=npm)](https://www.npmjs.com/package/@desource/context7-widget-react)
[![Svelte](https://img.shields.io/npm/v/@desource/context7-widget-svelte?logo=npm)](https://www.npmjs.com/package/@desource/context7-widget-svelte)
[![Angular](https://img.shields.io/npm/v/@desource/context7-widget-angular?logo=npm)](https://www.npmjs.com/package/@desource/context7-widget-angular)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

Add an AI documentation assistant to a product, docs site, dashboard, SDK portal,
or internal tool, then make it look like it belongs there.

Context7 indexes documentation and serves grounded answers through its hosted
chat widget. The official `https://context7.com/widget.js` script is fast to
install, but it exposes only a small styling and positioning surface. This
project keeps the same Context7 backend and install model, then adds the product
layer teams usually need before shipping a public support surface.

## What This Solves

- Visitors can ask product and API questions without leaving your site.
- Existing Context7 users can replace the script URL instead of rewriting an
  integration.
- Product teams can match the widget to their brand, layout, and interaction
  model.
- Developers get typed helpers, events, framework bindings, and a stable CSS
  customization contract.

If you are not familiar with Context7 yet: think of it as hosted, searchable,
AI-powered documentation for a library or product. After your library is
available in Context7, this package gives you a polished widget layer for your
own site.

## Package Surfaces

| Surface                                                   | Use it when                                                                                      |
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

## Quick Start

Replace the official Context7 script URL and keep `data-library`:

```html
<script async src="https://context7.desourcelabs.com/widget.js" data-library="/owner/repo"></script>
```

For a branded widget:

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

The widget still calls `https://context7.com/api/v2/widget/chat`. This package
does not proxy, fork, or replace Context7; it improves the client experience.

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

Swap the script origin. Your `data-library`, allowed-domain setup, and Context7
backend behavior stay the same.

```html
<!-- Before -->
<script async src="https://context7.com/widget.js" data-library="/owner/repo"></script>

<!-- After -->
<script async src="https://context7.desourcelabs.com/widget.js" data-library="/owner/repo"></script>
```

### Product or docs team new to Context7

1. Add or claim your library in Context7.
2. Put the widget script in the root layout of your docs or product site.
3. Choose a preset and position.
4. Add CSS variables or `::part()` overrides so the chat surface matches your UI.
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

- Official-compatible script replacement for the fastest migration path.
- Fixed corners, centered dialog, backdrop, and trigger-anchored positioning.
- Presets: `default`, `minimal`, `glass`, `neo`, `terminal`, and `brutalist`.
- Theme modes: `light`, `dark`, and `auto`.
- Preset-owned action colors when `color` is omitted.
- Custom triggers by selector, including anchored popovers.
- Typed DOM events for questions, streaming answers, tool calls, errors, and
  lifecycle state.
- Race-safe cancellation with a visible Stop action and imperative
  `cancel`/`retry`/`reset` controls.
- Multiline input, answer/code copying with repeat-click
  protection, error retry, complete UI localization, safe relative links,
  tables, task/nested lists, blockquotes, and highlighted code.
- Frame-throttled plain-text streaming that defers Markdown parsing until an
  answer completes, avoiding quadratic reparsing while long answers stream.
- Centered-dialog background isolation and scroll locking, focus containment,
  safe-area padding, and contained message scrolling.
- Public CSS variables and stable shadow parts for product-grade styling.
- Native Vue, React, Svelte, and Angular renderers with idiomatic controlled
  state, framework-native controls, managed triggers, and the same parameterized
  unit/browser contracts.
- Nuxt 3/4 module with component and composable auto-imports, app defaults, and
  optional global CSS.
- Daily upstream scanner for the official unversioned Context7 widget script.

## Customization

The core widget is a shadow-DOM custom element. Style it through the public
contract:

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

Common script attributes and component props:

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

The host element dispatches composed DOM events:

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
