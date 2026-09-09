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
- shared conversation engine, renderer bridge, transport, markdown, types,
  copy-action coordination, defaults, and brand assets from
  `@desource/context7-widget/kit`

## Before You Start

Use a library you have claimed on Context7. In its **Admin → Chat** settings,
enable the widget, add your site's domain to the allowed domains, and save.
Replace `/owner/repo` in the examples with that library's id. A library being
indexed alone does not enable chat on your site.
See [Context7's widget setup](https://context7.com/docs/howto/chat-widget).

## Install

```bash
npm install @desource/context7-widget-vue
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

```vue
<script setup lang="ts">
import { useContext7Widget } from '@desource/context7-widget-vue';
import '@desource/context7-widget-vue/styles.css';

const docs = useContext7Widget({
  autoMount: true,
  library: '/owner/repo',
  position: 'center',
  preset: 'terminal',
  widgetId: 'docs'
});

async function ask() {
  await docs.send('How do I customize the widget?');
  console.log(docs.isOpen.value, docs.isBusy.value, docs.messages.value);
}
</script>

<template>
  <button type="button" @click="ask">Ask documentation</button>
</template>
```

Automatic mounting happens after the owner mounts. Call `send`, `open`, and
other controls from an event handler or after the widget is ready.

The composable exposes reactive `widget`, `isOpen`, `isBusy`, and `messages`
refs plus `mount`, `unmount`, `open`, `close`, `toggle`, `send`, `cancel`,
`retry`, `reset`, and `getMessages`. `mount(overrides)` also updates an existing owned
widget, and those overrides remain in effect when reactive source options
change. Owned widgets are removed with their owner by default; set
`removeOnUnmount: false` only when another part of the app will own cleanup.
Call the composable during component `setup`; imperative `mount()` is
browser-only. Programmatically rendered widgets inherit the owner app context
and defaults provided by `createContext7WidgetPlugin`.

Without `autoMount`, the composable uses a package-level registry rather than
Vue or DOM ancestry. It resolves the newest registration for `widgetId`, which
defaults to `default`; if no default registration exists, that lookup falls back
to the first available widget. Duplicate ids form a stack, so unmounting the
newest registration restores the previous one.

## Examples

Use `v-model:open` when a parent owns visibility:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Context7Widget } from '@desource/context7-widget-vue';
import '@desource/context7-widget-vue/styles.css';

const open = ref(false);
</script>

<template>
  <Context7Widget v-model:open="open" library="/owner/repo" position="center" preset="glass" backdrop custom-trigger />
</template>
```

Use `useContext7Widget({ autoMount: true })` for route actions, command
palettes, or other imperative flows. More runnable patterns are available in
the [demo gallery](https://context7.desourcelabs.com/examples).

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

## Controlled Open State

Omit `open` for state initialized by `defaultOpen`. Use `v-model:open` when the
parent owns visibility:

```vue
<Context7Widget v-model:open="docsOpen" library="/owner/repo" />
```

The component emits `update:open` as the controlled-state request. `open` and
`close` remain lifecycle notifications emitted only after an actual transition.

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

## Customization

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
  --c7-trigger-background: #111827;
  --c7-trigger-border: rgba(255, 255, 255, 0.16);
  --c7-trigger-color: #f8fafc;
  --c7-trigger-focus: rgba(124, 255, 178, 0.42);
  --c7-trigger-radius: 8px;
  --c7-trigger-shadow: none;
}
```

See the
[live customization guide](https://context7.desourcelabs.com/customization)
for every public token and part.

## Props And Events

The component accepts the same public widget options as the core package:
`library`, `theme`, `preset`, `position`, `color`, `customTrigger`, `backdrop`,
`closeOnOutsideClick`, `defaultOpen`, `initialMessage`, `labels`,
`launcherLabel`, `launcherVariant`, `linkBaseUrl`, `panelHeight`, `panelWidth`,
`placeholder`, `title`, and `widgetId`.

Use `labels` for partial localization of every visible and assistive string,
including attribution and library fallbacks. `Context7WidgetLabels` is exported
for typed dictionaries.
Relative Markdown links resolve against the Context7 library page unless
`linkBaseUrl` supplies a documentation origin.

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

Vue events: `ready`, `open`, `close`, `cancel`, `question`, `first-token`,
`answer`, `answer-complete`, `tool-call`, `tool-result`, `error`, and
`update:open`.

Each handler receives the typed event detail as its only argument.

Component refs expose `open`, `close`, `toggle`, `send`, `cancel`, `retry`,
`reset`, `isOpen`, `isBusy`, `getMessages`, and `subscribe`. The composable adds
owned `mount`/`unmount` operations and reactive `widget`, `isOpen`, `isBusy`,
and `messages` refs. State listeners registered through `subscribe` are
isolated: if one throws, the error is reported without corrupting the request
or skipping the remaining listeners. Cancelling after answer tokens arrive
preserves the visible partial assistant message in `getMessages()` with
`status: 'cancelled'`.
`send()` resolves with a status result such as `complete`, `cancelled`, `error`,
`busy`, or `empty`.

While a response streams, the send action becomes an enabled **Stop** action.
The composer accepts multiline/code-paste input: Enter sends and Shift+Enter
inserts a newline. Completed answers and fenced code blocks can be copied, and
transport errors expose a retry action without duplicating the question.
Both built-in and external triggers receive `aria-controls`,
`aria-haspopup="dialog"`, and synchronized `aria-expanded`; attributes owned by
an external trigger are restored when it is unbound. Centered dialogs trap
focus, make outside content inert, and lock page scrolling, while non-modal
corner and anchored panels do not.

The component is SSR-safe. `useContext7Widget` can also be created during SSR,
but its imperative `mount()` method requires a browser document.

## Data Flow And Privacy

The browser posts the configured library id and current conversation messages
directly to `https://context7.com/api/v2/widget/chat`. DeSource Labs does not
proxy chat content. The package adds no analytics, cookies, or persistent
browser storage; conversation state remains in the mounted widget until
`reset()` or unmount. Emitted event payloads expose questions and answers to the
host application, so any logging, analytics, or persistence added there is the
integrator's data flow. Do not send secrets or sensitive personal data, and
review Context7's policies for backend processing and retention.

## Multiple Widgets And Packaging

Use a unique `widgetId` for each independently controlled widget. When duplicate
ids are mounted intentionally, the most recently mounted instance is resolved
and the previous instance becomes active again if the newer one unmounts.

The package exposes one JavaScript entry,
`@desource/context7-widget-vue`, containing the component, composable, plugin,
and public types. Styles are intentionally separate at
`@desource/context7-widget-vue/styles.css`; there are no component or composable
JavaScript subpaths. Vue and `@desource/context7-widget/kit` remain external
module dependencies, allowing the consuming app to deduplicate Vue and
tree-shake unused kit modules. The ESM entry and declarations are SSR-import
safe and validated with modern Node ESM and TypeScript bundler resolution.
