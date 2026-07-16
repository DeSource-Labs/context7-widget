# @desource/context7-widget

Core TypeScript package for the DeSource Labs Context7 widget.

```bash
pnpm add @desource/context7-widget
```

```ts
import { buildContext7WidgetScriptTag, mountContext7Widget } from '@desource/context7-widget';

mountContext7Widget({
  library: '/vercel/next.js',
  color: '#10b981',
  theme: 'auto',
  position: 'center',
  preset: 'glass',
  backdrop: true,
  closeOnOutsideClick: true
});

const script = buildContext7WidgetScriptTag({
  library: '/vercel/next.js',
  customTrigger: '#docs-chat',
  position: 'anchor'
});
```

Exports include the `context7-widget` custom element, script loader helpers,
stream transport, markdown renderer, typed widget options, event payload types,
and `./widget.js` for script hosting.

Supported presets are `default`, `minimal`, `glass`, `neo`, `terminal`, and
`brutalist`. Supported positions are fixed corners, `center`, and
`anchor` for trigger-attached popovers.

## Styling Contract

The custom element is designed to be themed from the host page. Use CSS
variables for product tokens and `::part(...)` for direct block styling. Avoid
internal `.c7-*` selectors.

```css
context7-widget[widget-id="docs"] {
  --c7-accent: #7cffb2;
  --c7-accent-contrast: #07120c;
  --c7-font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  --c7-panel-background: #101513;
  --c7-panel-color: #f7f2e8;
  --c7-border-color: rgba(247, 242, 232, 0.18);
  --c7-panel-radius: 8px;
}
```

Public variables:

- Brand/type: `--c7-accent`, `--c7-accent-contrast`, `--c7-font-family`, `--c7-muted-color`, `--c7-focus-ring`
- Panel: `--c7-panel-background`, `--c7-panel-backdrop-filter`, `--c7-panel-color`, `--c7-panel-width`, `--c7-panel-height`, `--c7-panel-radius`, `--c7-panel-shadow`, `--c7-border-color`, `--c7-spacing`, `--c7-z-index`
- Launcher: `--c7-launcher-background`, `--c7-launcher-color`, `--c7-launcher-gap`, `--c7-launcher-radius`, `--c7-launcher-shadow`, `--c7-launcher-size`
- Backdrop: `--c7-backdrop`, `--c7-backdrop-filter`
- Header/footer: `--c7-header-background`, `--c7-footer-background`
- Messages: `--c7-message-assistant-background`, `--c7-message-assistant-color`, `--c7-message-user-background`, `--c7-message-user-color`, `--c7-message-radius`, `--c7-error-background`, `--c7-error-color`
- Controls: `--c7-control-background`, `--c7-control-border`, `--c7-control-color`

The widget manages `--c7-anchor-left`, `--c7-anchor-top`, and
`--c7-anchor-origin` for `position: "anchor"` placement. They are not intended
as product-theme overrides.

Stable shadow parts:

`backdrop`, `panel`, `header`, `title`, `close-button`, `messages`, `message`,
`assistant-message`, `user-message`, `error-message`, `typing`, `tool-call`,
`tool-toggle`, `code-block`, `composer`, `input`, `send-button`, `footer`,
`powered-by`, and `launcher`.

Safe part overrides:

```css
context7-widget::part(panel) {
  box-shadow: none;
}

context7-widget::part(send-button) {
  min-width: 5rem;
  text-transform: uppercase;
}

context7-widget::part(code-block) {
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```
