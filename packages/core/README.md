# @desource/context7-widget

Core TypeScript package for a customizable Context7 documentation chat widget.

Use this package when you want the Context7 widget runtime without committing to
a framework binding. It exports the custom element, script loader helpers,
typed options, event detail types, the markdown renderer, transport helpers, and
the `./widget.js` browser build used by the hosted script.

The package root is side-effect free and tree-shakeable. Importing a transport,
Markdown, layout, or helper API does not register an element or boot the
drop-in script. The only self-starting entry is `./widget.js`.

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

## Drop-In Browser Script

No package manager or build step is required:

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/owner/repo"
  data-position="anchor"
  data-preset="glass"
></script>
```

The hosted file is a classic, self-starting IIFE. Multiple script tags are
supported when a page needs multiple independently configured widgets; give
each one a unique `data-widget-id`.

## Mount A Widget

```ts
import { mountContext7Widget } from '@desource/context7-widget';

const widget = mountContext7Widget({
  library: '/owner/repo',
  position: 'center',
  preset: 'glass',
  theme: 'auto',
  backdrop: true,
  closeOnOutsideClick: true
});

widget.open();
await widget.send('Show me the recommended setup.');
widget.cancel();
widget.reset();
```

`Context7WidgetElement` exposes `open`, `close`, `toggle`, `send`, `cancel`,
`reset`, `isOpen`, `isBusy`, and `getMessages`. The same operations are
available by `widgetId` through `window.Context7Widget`.

Imports are SSR-safe. Element creation, mounting, and imperative DOM operations
still require a browser document and fail with a focused error when called on
the server.

## Direct Custom Element

Register the element once when declarative markup fits your application better:

```ts
import { defineContext7Widget } from '@desource/context7-widget';

defineContext7Widget();
```

```html
<context7-widget library="/owner/repo" position="center" preset="minimal" backdrop="true"></context7-widget>
```

Custom tag names are supported without reusing the same registered constructor:

```ts
defineContext7Widget('context7-docs-widget');
```

## Options

JavaScript uses camel-case option names. Direct custom-element attributes use
kebab case; script installs prefix those attributes with `data-`.

| JavaScript option     | Custom-element attribute | Type / default                                                     |
| --------------------- | ------------------------ | ------------------------------------------------------------------ |
| `library`             | `library`                | Required Context7 library id                                       |
| `position`            | `position`               | `bottom-right`; also corners, `center`, or `anchor`                |
| `preset`              | `preset`                 | `default`; also `minimal`, `glass`, `neo`, `terminal`, `brutalist` |
| `theme`               | `theme`                  | `auto`; also `light` or `dark`                                     |
| `color`               | `color`                  | No override; presets own the accent                                |
| `customTrigger`       | `custom-trigger`         | CSS selector, simple element id, or Element in JavaScript          |
| `backdrop`            | `backdrop`               | `true` for `center`, otherwise `false`                             |
| `closeOnOutsideClick` | `close-on-outside-click` | `true`                                                             |
| `defaultOpen`         | `default-open`           | `false`                                                            |
| `initialMessage`      | `initial-message`        | Built-in greeting; `{library}` is interpolated                     |
| `launcherLabel`       | `launcher-label`         | `Ask Docs AI`                                                      |
| `launcherVariant`     | `launcher-variant`       | `icon`; also `pill` or `badge`                                     |
| `panelHeight`         | `panel-height`           | Responsive stylesheet default                                      |
| `panelWidth`          | `panel-width`            | Responsive stylesheet default                                      |
| `placeholder`         | `placeholder`            | `Ask about the docs...`                                            |
| `title`               | `dialog-title`           | `Chat with Documentation`                                          |
| `widgetId`            | `widget-id`              | `default`                                                          |

For script tags, `library` becomes `data-library`, `dialog-title` becomes
`data-title`, and the remaining attributes follow the same `data-*` pattern.
The custom element intentionally uses `dialog-title` rather than the native
HTML `title` attribute, avoiding an accidental browser tooltip.

Boolean attributes accept explicit values such as `backdrop="false"` and
`close-on-outside-click="false"`; their mere presence does not force them to
`true`.

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

Selector custom triggers hide the built-in launcher only after a matching
element binds. Missing or late-rendered selectors keep the launcher available
and bind automatically when the target appears.

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

```ts
import type { Context7WidgetQuestionEventDetail } from '@desource/context7-widget';

document.addEventListener('c7:answer-complete', (event) => {
  // `event.detail` is inferred from the event name.
  console.log(event.detail.library, event.detail.answer);
});

function trackQuestion(detail: Context7WidgetQuestionEventDetail) {
  console.log(detail.question);
}
```

Events: `c7:ready`, `c7:open`, `c7:close`, `c7:cancel`, `c7:question`,
`c7:first-token`, `c7:answer`, `c7:answer-complete`, `c7:tool-call`,
`c7:tool-result`, and `c7:error`.

Cancelling after answer tokens arrive preserves the visible partial assistant
message in `getMessages()` with `status: 'cancelled'`. `send()` resolves with a
status result such as `complete`, `cancelled`, `error`, `busy`, or `empty`.

## Exports

- `@desource/context7-widget`
- `@desource/context7-widget/kit` — rendering-independent transport, markdown,
  floating-layout calculation, contracts, defaults, and brand assets for
  framework packages
- `@desource/context7-widget/widget.js`

The root and `/kit` are ESM-only and preserve internal module boundaries.
Downstream bundlers can therefore remove the custom-element runtime when an
application imports only a helper such as `renderMarkdown` or
`updateAnchorPosition`. The `widget.js` subpath is the classic browser
script and intentionally has side effects.

The custom element shares one constructable stylesheet across instances when
the browser supports it and falls back to an inline shadow stylesheet
otherwise. Streamed Markdown rendering is frame-throttled, while answer events
remain available for every received chunk.

The package publishes ESM only. Its root and `/kit` declarations are validated
for modern Node ESM and TypeScript bundler resolution.

## Browser, Accessibility, And Security Notes

The runtime targets ES2020-era modern browsers with Custom Elements, open
Shadow DOM, `fetch`, `ReadableStream`, and `AbortController`. Constructable
stylesheets are shared when available; older browsers receive an inline
`<style>` fallback. Centered panels use modal dialog semantics, keep keyboard
focus inside the panel, close with Escape, and restore focus to the opener.
Corner and anchored panels remain non-modal.

For a restrictive Content Security Policy, allow:

- the widget origin in `script-src`;
- `https://context7.com` in `connect-src`;
- `data:` in `img-src` for the embedded DeSource Labs mark.

Browsers using the inline stylesheet fallback also need a compatible
`style-src` policy. Test the final policy in every browser your application
supports.
