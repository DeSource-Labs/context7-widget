# @desource/context7-widget-nuxt

Nuxt 3 and Nuxt 4 module for the native Vue Context7 documentation chat widget.

The module registers `Context7Widget`, auto-imports `useContext7Widget`, loads the shared stylesheet, and can provide app-wide widget defaults. It reuses `@desource/context7-widget-vue`; it does not contain another renderer, conversation engine, transport, or Markdown implementation.

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
    library="/vercel/nuxt"
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

- [`@desource/context7-widget-vue`](../vue) provides the component, composable, plugin helper, events, and public types.
- [`@desource/context7-widget`](../core) provides the browser custom element and shared headless kit.

## License

[MIT](./LICENSE) © 2026 DeSource Labs
