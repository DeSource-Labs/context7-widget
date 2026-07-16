# @desource/context7-widget-vue

Vue 3 bindings for `@desource/context7-widget`.

```vue
<template>
  <Context7Widget
    library="/desource-labs/context7-widget"
    color="#10b981"
    theme="auto"
    position="anchor"
    preset="glass"
    launcher-variant="pill"
    @question="trackQuestion"
  />
</template>

<script setup lang="ts">
import { Context7Widget, type Context7WidgetEventDetail } from '@desource/context7-widget-vue';

function trackQuestion(detail: Context7WidgetEventDetail) {
  console.log(detail.question);
}
</script>
```

Composable usage:

```ts
import { useContext7Widget } from '@desource/context7-widget-vue';

const docs = useContext7Widget({
  autoMount: true,
  library: '/desource-labs/context7-widget',
  position: 'center',
  preset: 'terminal',
  widgetId: 'docs'
});

await docs.send('How do I theme the widget?');
```

Custom trigger modes:

```vue
<!-- Use the built-in widget launcher -->
<Context7Widget library="/desource-labs/context7-widget" />

<!-- Render the Vue package trigger button -->
<Context7Widget
  library="/desource-labs/context7-widget"
  custom-trigger
  launcher-label="Ask docs"
/>

<!-- Bind to your own button by id, with or without # -->
<button id="docs-help">Ask docs</button>
<Context7Widget
  library="/desource-labs/context7-widget"
  custom-trigger="docs-help"
/>
```

Optional SCSS-built styles are published as:

```ts
import '@desource/context7-widget-vue/styles.css';
```

## Styling

The Vue component renders the same `context7-widget` custom element as the core
package, so all core CSS variables and shadow parts still apply:

```css
context7-widget {
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

Core variables include:

`--c7-accent`, `--c7-accent-contrast`, `--c7-font-family`,
`--c7-muted-color`, `--c7-focus-ring`, `--c7-panel-background`,
`--c7-panel-backdrop-filter`, `--c7-panel-color`, `--c7-panel-width`,
`--c7-panel-height`, `--c7-panel-radius`, `--c7-panel-shadow`,
`--c7-border-color`, `--c7-spacing`, `--c7-z-index`,
`--c7-launcher-background`, `--c7-launcher-color`, `--c7-launcher-gap`,
`--c7-launcher-radius`, `--c7-launcher-shadow`, `--c7-launcher-size`,
`--c7-backdrop`, `--c7-backdrop-filter`, `--c7-header-background`,
`--c7-footer-background`, `--c7-message-assistant-background`,
`--c7-message-assistant-color`, `--c7-message-user-background`,
`--c7-message-user-color`, `--c7-message-radius`, `--c7-error-background`,
`--c7-error-color`, `--c7-control-background`, `--c7-control-border`, and
`--c7-control-color`.

Stable shadow parts are:

`backdrop`, `panel`, `header`, `title`, `close-button`, `messages`, `message`,
`assistant-message`, `user-message`, `error-message`, `typing`, `tool-call`,
`tool-toggle`, `code-block`, `composer`, `input`, `send-button`, `footer`,
`powered-by`, and `launcher`.

When `custom-trigger` is `true`, the Vue package renders a managed trigger
button. After importing `@desource/context7-widget-vue/styles.css`, customize it
with:

```css
.context7-widget-trigger {
  --c7-vue-trigger-background: #111827;
  --c7-vue-trigger-border: rgba(255, 255, 255, 0.16);
  --c7-vue-trigger-color: #f8fafc;
  --c7-vue-trigger-focus: rgba(124, 255, 178, 0.42);
  --c7-vue-trigger-radius: 8px;
  --c7-vue-trigger-shadow: none;
}
```

`Context7Widget.vue` is a standard Vue SFC. It exposes the underlying custom
element through `ref`, maps all `c7:*` DOM events to Vue events, and accepts the
same typed options as the core package. Vue additionally accepts
`customTrigger` as `true` to render a managed trigger button; internally it is
mapped back to the core widget's selector-based `customTrigger` API.
