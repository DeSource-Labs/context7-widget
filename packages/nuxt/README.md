# @desource/context7-widget-nuxt

[![Nuxt](https://img.shields.io/npm/v/@desource/context7-widget-nuxt?color=blue&logo=nuxt)](https://www.npmjs.com/package/@desource/context7-widget-nuxt)
[![Coverage](https://codecov.io/gh/DeSource-Labs/context7-widget/branch/main/graph/badge.svg)](https://codecov.io/gh/DeSource-Labs/context7-widget)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=DeSource-Labs_context7-widget&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DeSource-Labs_context7-widget)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/DeSource-Labs/context7-widget/blob/main/LICENSE)

Add Context7 docs chat to Nuxt 3 or 4 and style it to match your site. This MIT-licensed module sets up the native Vue widget, its stylesheet, auto-imports, and app-wide defaults.

## Why Use This Widget?

Context7 provides its docs widget and hosted AI answers for free. Its basic
styling can leave chat looking out of place. This upgrade adds fonts, colors,
custom triggers, and layouts to match your site, plus copyable code, multiline
input, Stop, and Retry.

[Upgrade your existing script](https://github.com/DeSource-Labs/context7-widget#existing-context7-widget-user)
or add the module below with the same library and domain settings. New to
Context7? Help visitors explore your library and start their first integration.
The module reuses Vue and the shared core.

## Before You Start

Use a library you have claimed on Context7. In its **Admin → Chat** settings,
enable the widget, add your site's domain to the allowed domains, and save.
Replace `/owner/repo` in the examples with that library's id. A library being
indexed alone does not enable chat on your site.
See [Context7's widget setup](https://context7.com/docs/howto/chat-widget).

## Install

```bash
pnpm add @desource/context7-widget-nuxt
```

Add the module and configure the documentation library once:

```ts
export default defineNuxtConfig({
  modules: ['@desource/context7-widget-nuxt'],
  context7Widget: {
    defaults: {
      library: '/owner/repo'
    }
  }
});
```

`Context7Widget` and `useContext7Widget` are now available without imports. The stylesheet is added before application CSS so application rules can override it.

## Examples

### Render the widget

```vue
<template>
  <Context7Widget />
</template>
```

Props override module defaults for that instance:

```vue
<template>
  <Context7Widget
    library="/owner/another-repo"
    position="anchor"
    preset="glass"
    theme="auto"
    widget-id="nuxt-docs"
    @question="onQuestion"
  />
</template>

<script setup lang="ts">
import type { Context7WidgetQuestionEventDetail } from '@desource/context7-widget-vue';

function onQuestion(detail: Context7WidgetQuestionEventDetail) {
  console.log(detail.library, detail.question);
}
</script>
```

### Control open state

```vue
<script setup lang="ts">
const open = ref(false);
</script>

<template>
  <button type="button" @click="open = true">Ask documentation</button>
  <Context7Widget v-model:open="open" position="center" />
</template>
```

### Use the composable

`useContext7Widget` can control a rendered widget by `widgetId` or mount a native Vue widget programmatically after the owner component mounts.

```vue
<script setup lang="ts">
const docs = useContext7Widget({ widgetId: 'docs' });

async function ask() {
  docs.open();
  await docs.send('How do I configure this module?');
}
</script>

<template>
  <button type="button" @click="ask">Ask</button>
  <Context7Widget widget-id="docs" />
</template>
```

For programmatic mounting:

```vue
<script setup lang="ts">
const docs = useContext7Widget({
  autoMount: true,
  library: '/owner/repo',
  preset: 'terminal',
  widgetId: 'programmatic-docs'
});
</script>

<template>
  <button type="button" @click="docs.toggle">Toggle documentation chat</button>
</template>
```

### Use a custom trigger

```vue
<template>
  <Context7Widget custom-trigger launcher-label="Ask docs">
    <template #trigger="{ label }">
      <span>{{ label }}</span>
    </template>
  </Context7Widget>
</template>
```

External selector, Vue ref, and direct `Element` triggers work as described by the Vue package.

## Module options

```ts
export default defineNuxtConfig({
  modules: ['@desource/context7-widget-nuxt'],
  context7Widget: {
    component: true,
    componentName: 'Context7Widget',
    composable: true,
    css: true,
    defaults: {
      library: '/owner/repo',
      preset: 'default',
      theme: 'auto'
    }
  }
});
```

| Option          | Default          | Purpose                                                     |
| --------------- | ---------------- | ----------------------------------------------------------- |
| `component`     | `true`           | Auto-register the native Vue component                      |
| `componentName` | `Context7Widget` | Change the auto-imported component name                     |
| `composable`    | `true`           | Auto-import `useContext7Widget`                             |
| `css`           | `true`           | Add `@desource/context7-widget-vue/styles.css` globally     |
| `defaults`      | `{}`             | Provide app-wide widget props to components and composables |

`defaults` accepts serializable widget props. Instance props take precedence. Controlled `open` state and DOM-backed `customTrigger` values belong on a component instance, so the module type excludes them.

Disable unused integrations when an application imports them another way:

```ts
export default defineNuxtConfig({
  modules: ['@desource/context7-widget-nuxt'],
  context7Widget: {
    component: false,
    composable: false,
    css: false
  }
});
```

The component and composable are registered as Nuxt auto-imports. Nuxt only includes them in an application chunk when used.

## Customization

Module defaults set the common theme, placement, dimensions, labels, and library:

```ts
export default defineNuxtConfig({
  modules: ['@desource/context7-widget-nuxt'],
  context7Widget: {
    defaults: {
      color: '#7cffb2',
      labels: {
        send: 'Ask'
      },
      panelHeight: 'min(42rem, 80vh)',
      panelWidth: 'min(28rem, calc(100vw - 2rem))',
      position: 'bottom-right',
      preset: 'glass',
      title: 'Project documentation'
    }
  }
});
```

Override CSS variables and public parts from application CSS:

```css
.context7-widget[widget-id='docs'] {
  --c7-accent: #7cffb2;
  --c7-panel-background: #101513;
  --c7-panel-color: #f7f2e8;
  --c7-panel-radius: 8px;
}

.context7-widget [part~='send-button'] {
  min-width: 5rem;
}
```

Set `css: false` if the application imports `@desource/context7-widget-vue/styles.css` itself.

## TypeScript

Module options are typed through Nuxt's `context7Widget` config key. Import component, event, option, controller, and composable types from `@desource/context7-widget-vue`:

```ts
import type {
  Context7WidgetController,
  Context7WidgetProps,
  Context7WidgetQuestionEventDetail,
  UseContext7WidgetReturn
} from '@desource/context7-widget-vue';
```

The module does not duplicate the Vue package's type export list as global auto-imports. New Vue types remain available without Nuxt module changes.

## SSR behavior

The native Vue component is SSR-safe and does not need `ClientOnly`. Browser-only behavior starts after mount. `useContext7Widget` can be created during setup on the server; its imperative `mount()` method requires a browser document.

## Data flow and privacy

The browser posts the configured library id and current conversation directly to `https://context7.com/api/v2/widget/chat`. The module adds no proxy, analytics, cookies, or persistent storage. Event handlers in the host application can expose question and answer data to any logging or analytics system they call.

## Related packages

- [`@desource/context7-widget`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/core) provides the browser custom element, drop-in script, TypeScript helpers, and shared headless engine.
- [`@desource/context7-widget-vue`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/vue) provides a native Vue 3 component, composable, plugin defaults, and custom trigger slots.
- [`@desource/context7-widget-react`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/react) provides a native React component, controlled open state, a programmatic hook, and custom triggers.
- [`@desource/context7-widget-svelte`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/svelte) provides a native Svelte 5 component, bindable open state, trigger snippets, and a reactive controller.
- [`@desource/context7-widget-angular`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/angular) provides a standalone Angular component, signals, application defaults, and injectable controls.
