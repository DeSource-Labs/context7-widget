# Context7 Widget

[![Coverage](https://codecov.io/gh/DeSource-Labs/context7-widget/branch/main/graph/badge.svg)](https://codecov.io/gh/DeSource-Labs/context7-widget)
[![npm core](https://img.shields.io/npm/v/@desource/context7-widget?logo=npm)](https://www.npmjs.com/package/@desource/context7-widget)
[![npm vue](https://img.shields.io/npm/v/@desource/context7-widget-vue?logo=npm)](https://www.npmjs.com/package/@desource/context7-widget-vue)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

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

| Surface                                           | Use it when                                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `https://context7.desource-labs.org/widget.js`    | You want a drop-in script tag for HTML, Docusaurus, Next.js, Astro, Nuxt, Vite, or static pages |
| [`@desource/context7-widget`](./packages/core)    | You want TypeScript helpers, the custom element, script generation, or direct runtime control   |
| [`@desource/context7-widget-vue`](./packages/vue) | You want a Vue 3 component, composable, plugin helper, typed events, and managed triggers       |

Coming next: Nuxt, React, Svelte, and Angular packages. Each framework package
will own its UI and lifecycle while sharing transport, markdown, types, defaults,
and brand assets through `@desource/context7-widget/kit`.

## Quick Start

Replace the official Context7 script URL and keep `data-library`:

```html
<script async src="https://context7.desource-labs.org/widget.js" data-library="/owner/repo"></script>
```

For a branded widget:

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

The widget still calls `https://context7.com/api/v2/widget/chat`. This package
does not proxy, fork, or replace Context7; it improves the client experience.

## Choose A Path

### Existing Context7 widget user

Swap the script origin. Your `data-library`, allowed-domain setup, and Context7
backend behavior stay the same.

```html
<!-- Before -->
<script async src="https://context7.com/widget.js" data-library="/owner/repo"></script>

<!-- After -->
<script async src="https://context7.desource-labs.org/widget.js" data-library="/owner/repo"></script>
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
pnpm add @desource/context7-widget-vue
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
pnpm add @desource/context7-widget
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
  `cancel`/`reset` controls.
- Frame-throttled streamed Markdown rendering and shared constructable styles
  for efficient multi-instance use.
- Public CSS variables and stable shadow parts for product-grade styling.
- Vue component, composable, plugin helper, managed trigger button, and trigger
  slot.
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

See the live customization guide at `/customization` and the integration
examples at `/examples`.

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
- `launcherLabel`
- `launcherVariant`
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

Core and framework package builds use Vite 8. The demo site builds packages,
copies `packages/core/dist/widget.js` into `demo/public/widget.js`, then runs
Nuxt.

CI enforces coverage floors, production dependency and peer checks, package
metadata/type validation, SSR imports, and gzip budgets for the hosted widget
and real tree-shaken consumers of core, `/kit`, all framework related packages, and their stylesheets.
Core and framework related packages also run the same real-Chromium behavior suite.

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
