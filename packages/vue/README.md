# @desource/context7-widget-vue

Vue 3 bindings for the customizable Context7 documentation chat widget.

Use this package when the widget belongs inside a Vue component tree and you
want typed props, typed events, a composable API, a plugin helper, managed
triggers, and a framework-native implementation.

## What You Get

- `Context7Widget.vue` as a standard Vue single-file component
- `useContext7Widget` composable for programmatic control
- idiomatic Vue emits backed by shared event-detail contracts
- `customTrigger` as `true`, selector string, or omitted
- managed trigger slot for product-specific buttons
- complete widget styles in `styles.css`
- shared transport, markdown, types, defaults, and brand assets from
  `@desource/context7-widget/kit`

## Install

```bash
pnpm add @desource/context7-widget-vue
```

Import the stylesheet once in your application entry:

```ts
import '@desource/context7-widget-vue/styles.css';
```

## Component

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

## Composable

```ts
import { useContext7Widget } from '@desource/context7-widget-vue';

const docs = useContext7Widget({
  autoMount: true,
  library: '/owner/repo',
  position: 'center',
  preset: 'terminal',
  widgetId: 'docs'
});

await docs.send('How do I customize the widget?');
```

## Plugin

Register the native component under a custom name and provide app-wide defaults:

```ts
import { createApp } from 'vue';
import { createContext7WidgetPlugin } from '@desource/context7-widget-vue';

createApp(App)
  .use(
    createContext7WidgetPlugin({
      componentName: 'DocsWidget',
      defaults: {
        preset: 'glass',
        theme: 'auto'
      }
    })
  )
  .mount('#app');
```

Defaults are inherited by rendered Vue components; the plugin does not create a
second, imperative widget.

## Trigger Modes

```vue
<!-- Built-in floating launcher -->
<Context7Widget library="/owner/repo" />

<!-- Vue renders a package-managed button -->
<Context7Widget library="/owner/repo" custom-trigger launcher-label="Ask docs" />

<!-- Vue renders the button, you control its markup -->
<Context7Widget library="/owner/repo" custom-trigger>
  <template #trigger="{ label }">
    <span class="docs-dot" />
    <span>{{ label }}</span>
  </template>
</Context7Widget>

<!-- Bind to a button anywhere by id, with or without # -->
<button id="docs-help">Ask docs</button>
<Context7Widget library="/owner/repo" custom-trigger="docs-help" />
```

When `customTrigger` is set, the Vue floating launcher is not rendered. Your app
owns the button while the Vue component owns the panel.

## Styling

The Vue component renders native Vue DOM under `.context7-widget`; it does not
mount the core custom element. Customize it with the shared CSS variables:

```css
.context7-widget[widget-id='docs'] {
  --c7-accent: #7cffb2;
  --c7-panel-background: #101513;
  --c7-panel-color: #f7f2e8;
  --c7-border-color: rgba(247, 242, 232, 0.18);
  --c7-panel-radius: 8px;
}

.context7-widget [part~='send-button'] {
  min-width: 5rem;
  text-transform: uppercase;
}
```

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

## Props And Events

The component accepts the same public widget options as the core package:
`library`, `theme`, `preset`, `position`, `color`, `customTrigger`, `backdrop`,
`closeOnOutsideClick`, `defaultOpen`, `initialMessage`, `launcherLabel`,
`launcherVariant`, `panelHeight`, `panelWidth`, `placeholder`,
`title`, and `widgetId`.

Vue events: `ready`, `open`, `close`, `question`, `first-token`, `answer`,
`answer-complete`, `tool-call`, `tool-result`, and `error`.

Each handler receives the typed event detail as its only argument.
