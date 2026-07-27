# @desource/context7-widget

Core TypeScript package for a customizable Context7 documentation chat widget.

Use this package when you want the Context7 widget runtime without committing to
a framework binding. It exports the custom element, script loader helpers,
typed options, event detail types, the markdown renderer, transport helpers, and
the `./widget.js` browser build used by the hosted script.

## Why It Exists

Context7 gives teams an AI assistant grounded in their documentation. The
official widget is easy to install, but its public UI surface is intentionally
small. This package keeps the Context7 backend and adds the client-side controls
needed for real product sites:

- theme presets and brand-token overrides
- centered, anchored, and fixed-corner placement
- custom triggers
- typed events for analytics and debugging
- a stable CSS variable and shadow-part contract
- framework-agnostic helpers for future React, Svelte, Nuxt, and Angular
  bindings

## Install

```bash
pnpm add @desource/context7-widget
```

## Mount A Widget

```ts
import { mountContext7Widget } from '@desource/context7-widget';

mountContext7Widget({
  library: '/owner/repo',
  position: 'center',
  preset: 'glass',
  theme: 'auto',
  backdrop: true,
  closeOnOutsideClick: true
});
```

## Generate A Script Tag

```ts
import { buildContext7WidgetScriptTag } from '@desource/context7-widget';

const script = buildContext7WidgetScriptTag({
  library: '/owner/repo',
  customTrigger: '#docs-chat',
  position: 'anchor',
  preset: 'minimal'
});
```

The script still sends chat requests to `https://context7.com`. This package
does not run a Context7 proxy; it supplies the customizable client layer.

## Supported Visual Modes

- Positions: `bottom-right`, `bottom-left`, `top-right`, `top-left`, `center`,
  and `anchor`
- Presets: `default`, `minimal`, `glass`, `neo`, `terminal`, and `brutalist`
- Themes: `light`, `dark`, and `auto`
- Launcher variants: `icon`, `pill`, and `badge`

If `color` is omitted, the preset owns the launcher and send-button color. Set
`color` only when your product needs a brand override.

## Styling Contract

Style the custom element from the host page. Do not target internal `.c7-*`
classes.

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

Public variables include:

- Brand/type: `--c7-accent`, `--c7-accent-contrast`, `--c7-font-family`,
  `--c7-muted-color`, `--c7-focus-ring`
- Panel: `--c7-panel-background`, `--c7-panel-backdrop-filter`,
  `--c7-panel-color`, `--c7-panel-width`, `--c7-panel-height`,
  `--c7-panel-radius`, `--c7-panel-shadow`, `--c7-border-color`,
  `--c7-spacing`, `--c7-z-index`
- Launcher: `--c7-launcher-background`, `--c7-launcher-color`,
  `--c7-launcher-gap`, `--c7-launcher-radius`, `--c7-launcher-shadow`,
  `--c7-launcher-size`
- Backdrop: `--c7-backdrop`, `--c7-backdrop-filter`
- Header/footer: `--c7-header-background`, `--c7-footer-background`
- Messages: `--c7-message-assistant-background`,
  `--c7-message-assistant-color`, `--c7-message-user-background`,
  `--c7-message-user-color`, `--c7-message-radius`,
  `--c7-error-background`, `--c7-error-color`
- Controls: `--c7-control-background`, `--c7-control-border`,
  `--c7-control-color`

Stable shadow parts:

`backdrop`, `panel`, `header`, `title`, `close-button`, `messages`, `message`,
`assistant-message`, `user-message`, `error-message`, `typing`, `tool-call`,
`tool-toggle`, `code-block`, `composer`, `input`, `send-button`, `footer`,
`powered-by`, and `launcher`.

## Events

Listen on the element or at `document` level:

```js
document.addEventListener('c7:answer-complete', (event) => {
  console.log(event.detail.library, event.detail.answer);
});
```

Events: `c7:ready`, `c7:open`, `c7:close`, `c7:question`, `c7:first-token`,
`c7:answer`, `c7:answer-complete`, `c7:tool-call`, `c7:tool-result`, and
`c7:error`.

## Exports

- `@desource/context7-widget`
- `@desource/context7-widget/kit` — rendering-independent transport, markdown,
  contracts, defaults, and brand assets for framework packages
- `@desource/context7-widget/widget.js`
