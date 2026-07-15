# Context7 Widget

A themeable, Context7-compatible widget system for teams that like the official
`https://context7.com/widget.js` install path, but need the UI to feel native in
polished product and documentation sites.

This repository now ships three surfaces:

- `https://context7.desource-labs.org/widget.js`: one-line script replacement.
- `@desource/context7-widget`: core TypeScript package and custom element.
- `@desource/context7-widget-vue`: Vue 3 component, composable, plugin helper,
  typed events, and SCSS-built helper styles.

The Nuxt information site lives in `apps/site` and is designed for Vercel static
hosting at `context7.desource-labs.org`.

## Quick Start

Replace the official script URL and keep the existing Context7 attributes:

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
></script>
```

Existing official attributes continue to work:

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
  data-color="#111827"
  data-position="bottom-right"
  data-placeholder="Ask about the docs..."
  data-welcome-message="Ask me about Next.js."
></script>
```

The widget always calls `https://context7.com/api/v2/widget/chat`; replacing the
script origin does not change the Context7 backend.

Additional attributes cover product-app use cases that the official script does
not expose:

- `data-position`: `bottom-right`, `bottom-left`, `top-right`, `top-left`, `center`, or `anchor`.
- `data-preset`: `default`, `minimal`, `glass`, `neo`, `terminal`, or `brutalist`.
- `data-launcher-variant`: `icon`, `pill`, or `badge`.
- `data-backdrop`, `data-close-on-outside-click`, `data-panel-width`, `data-panel-height`, and `data-show-powered-by`.

If `data-color` / `color` is omitted, the selected preset owns the action color.
Set `color` only when you want a brand override.

## Core Package

```bash
pnpm add @desource/context7-widget
```

```ts
import {
  buildContext7WidgetScriptTag,
  mountContext7Widget
} from "@desource/context7-widget";

mountContext7Widget({
  backdrop: true,
  color: "#10b981",
  closeOnOutsideClick: true,
  library: "/vercel/next.js",
  position: "center",
  preset: "glass",
  theme: "auto"
});

const script = buildContext7WidgetScriptTag({
  library: "/vercel/next.js",
  customTrigger: "#docs-chat",
  hideDefaultButton: true
});
```

The core package exports the custom element, stream transport, markdown renderer,
script-tag helpers, typed widget options, and the global API types.

## Vue Package

```bash
pnpm add @desource/context7-widget-vue
```

```vue
<template>
  <Context7Widget
    library="/vercel/next.js"
    color="#10b981"
    position="anchor"
    preset="glass"
    theme="auto"
    @question="trackQuestion"
  />
</template>

<script setup lang="ts">
import { Context7Widget, type Context7WidgetEventDetail } from "@desource/context7-widget-vue";

function trackQuestion(detail: Context7WidgetEventDetail) {
  console.log(detail.question);
}
</script>
```

Composable:

```ts
import { useContext7Widget } from "@desource/context7-widget-vue";

const docs = useContext7Widget({
  autoMount: true,
  library: "/vercel/next.js",
  widgetId: "docs"
});

await docs.send("How do I customize the widget?");
```

## Styling

Theme through CSS custom properties:

```css
context7-widget {
  --c7-accent: #ef4444;
  --c7-font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  --c7-panel-background: #050505;
  --c7-panel-color: #f8fafc;
  --c7-border-color: rgba(255, 255, 255, 0.16);
  --c7-panel-radius: 6px;
  --c7-launcher-radius: 0;
}
```

Or use shadow parts when your design system needs direct component styling:

```css
context7-widget::part(panel) {
  box-shadow: none;
}

context7-widget::part(send-button) {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

## Events And API

The host element dispatches composed DOM events:

- `c7:ready`
- `c7:open`
- `c7:close`
- `c7:question`
- `c7:first-token`
- `c7:answer`
- `c7:answer-complete`
- `c7:tool-call`
- `c7:tool-result`
- `c7:error`

The script loader also registers `window.Context7Widget`:

```js
window.Context7Widget.open();
window.Context7Widget.send("How do I configure middleware?");
window.Context7Widget.close();
```

Use `data-custom-trigger` and `data-hide-default-button` to connect the widget
to your own UI:

```html
<button id="docs-chat">Ask docs</button>

<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
  data-custom-trigger="#docs-chat"
  data-hide-default-button="true"
></script>
```

The Nuxt site includes live examples at `/examples` for centered, anchored, script,
core, Vue component, and Vue composable integrations.

## Local Development

```bash
pnpm install
pnpm lint:all
pnpm test:all
pnpm build:all
pnpm dev:site
```

Core and Vue package builds use Vite 8. The Nuxt site build first builds both
packages, then copies `packages/core/dist/widget.js` into `apps/site/public`.

Useful workspaces:

- core package: `packages/core` (`@desource/context7-widget`)
- Vue package: `packages/vue`
- Nuxt site: `apps/site`

The site build syncs `packages/core/dist/widget.js` to
`apps/site/public/widget.js` before Nuxt generates the static output.

## Maintenance

The daily upstream scanner downloads `https://context7.com/widget.js`, stores the
latest raw script in `upstream/context7-widget.latest.js`, and opens a GitHub
issue when the upstream hash changes. Functional compatibility still depends on
Context7's hosted backend, so behavior changes can happen without a script diff.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for project boundaries and
[docs/INTEGRATION.md](docs/INTEGRATION.md) for integration recipes.
