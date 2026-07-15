# @desource/context7-widget-vue

Vue 3 bindings for `@desource/context7-widget`.

```vue
<template>
  <Context7Widget
    library="/desource-labs/context7-widget"
    color="#10b981"
    theme="auto"
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
  widgetId: 'docs'
});

await docs.send('How do I theme the widget?');
```

Optional SCSS-built styles are published as:

```ts
import '@desource/context7-widget-vue/styles.css';
```
