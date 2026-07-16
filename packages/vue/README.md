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

`Context7Widget.vue` is a standard Vue SFC. It exposes the underlying custom
element through `ref`, maps all `c7:*` DOM events to Vue events, and accepts the
same typed options as the core package. Vue additionally accepts
`customTrigger` as `true` to render a managed trigger button; internally it is
mapped back to the core widget's selector-based `customTrigger` API.
