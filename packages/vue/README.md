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

In Nuxt, the equivalent global setup is:

```ts
export default defineNuxtConfig({
  css: ['@desource/context7-widget-vue/styles.css']
});
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
console.log(docs.isOpen.value, docs.isBusy.value, docs.messages.value);

docs.cancel();
docs.reset();
```

The composable exposes reactive `widget`, `isOpen`, `isBusy`, and `messages`
refs plus `mount`, `unmount`, `open`, `close`, `toggle`, `send`, `cancel`,
`reset`, and `getMessages`. `mount(overrides)` also updates an existing owned
widget, and those overrides remain in effect when reactive source options
change. Owned widgets are removed with their owner by default; set
`removeOnUnmount: false` only when another part of the app will own cleanup.
Call the composable during component `setup`; imperative `mount()` is
browser-only. Programmatically rendered widgets inherit the owner app context
and defaults provided by `createContext7WidgetPlugin`.

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

Defaults are inherited by rendered Vue components and composable-owned widgets;
the plugin does not create a second widget. Plugin options are captured when the
plugin is created, so mutating the original options object later does not alter
installed application behavior.

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

<!-- Full CSS selectors are supported too -->
<button class="docs-help">Ask docs</button>
<Context7Widget library="/owner/repo" custom-trigger=".docs-help" />

<!-- Vue refs and direct Elements are supported for external triggers -->
<button ref="docsHelp">Ask docs</button>
<Context7Widget library="/owner/repo" :custom-trigger="docsHelp" />
```

External custom triggers hide the Vue floating launcher only after they bind.
Missing or late-rendered selectors keep the launcher available and bind
automatically when the target appears.

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

Defaults are shared with core: `position="bottom-right"`, `preset="default"`,
`theme="auto"`, `launcher-variant="icon"`, and `widget-id="default"`. A centered
widget enables its backdrop unless `:backdrop="false"` is explicit.

Vue’s only prop-level difference is `customTrigger`:

| Value        | Behavior                                                   |
| ------------ | ---------------------------------------------------------- |
| omitted      | Render the built-in floating launcher                      |
| `true`       | Render the Vue-managed trigger and expose the trigger slot |
| id string    | Bind an external trigger by id, with or without `#`        |
| CSS selector | Bind the first matching external trigger                   |
| Element/ref  | Bind the provided external trigger element                 |

Vue events: `ready`, `open`, `close`, `question`, `first-token`, `answer`,
`answer-complete`, `tool-call`, `tool-result`, and `error`.

Each handler receives the typed event detail as its only argument.

Component refs expose the same control surface as the composable:
`open`, `close`, `toggle`, `send`, `cancel`, `reset`, `isOpen`, `isBusy`, and
`getMessages`.

While a response streams, the send action becomes an enabled **Stop** action.
Both built-in and external triggers receive `aria-controls`,
`aria-haspopup="dialog"`, and synchronized `aria-expanded`; attributes owned by
an external trigger are restored when it is unbound. Centered dialogs trap
focus, while non-modal corner and anchored panels do not.

The component is SSR-safe. `useContext7Widget` can also be created during SSR,
but its imperative `mount()` method requires a browser document.

## Multiple Widgets And Packaging

Use a unique `widgetId` for each independently controlled widget. When duplicate
ids are mounted intentionally, the most recently mounted instance is resolved
and the previous instance becomes active again if the newer one unmounts.

The package publishes ESM plus a separate minified stylesheet. Vue and
`@desource/context7-widget/kit` remain external module dependencies, allowing
the consuming app to deduplicate Vue and tree-shake unused kit modules. The
published entry and declarations are SSR-import safe and validated with modern
Node ESM and TypeScript bundler resolution.
