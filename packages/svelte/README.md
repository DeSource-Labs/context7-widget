# @desource/context7-widget-svelte

Native Svelte 5 bindings for the Context7 documentation chat widget. The runes component renders light DOM and owns Svelte lifecycle, callback props, snippets, and bindable state. The core kit supplies the conversation engine, transport, safe Markdown, accessibility, and layout primitives without shipping the core custom element.

## Before You Start

Use a library you have claimed on Context7. In its **Admin → Chat** settings,
enable the widget, add your site's domain to the allowed domains, and save.
Replace `/owner/repo` in the examples with that library's id. A library being
indexed alone does not enable chat on your site.
See [Context7's widget setup](https://context7.com/docs/howto/chat-widget).

## Install

```bash
npm install @desource/context7-widget-svelte
```

Import the widget stylesheet once:

```ts
import '@desource/context7-widget-svelte/styles.css';
```

## Examples

### Component

```svelte
<script lang="ts">
  import { Context7Widget, type Context7WidgetHandle } from '@desource/context7-widget-svelte';
  import '@desource/context7-widget-svelte/styles.css';

  let widget: Context7WidgetHandle;
  let open = $state(false);
</script>

<Context7Widget
  bind:this={widget}
  bind:open
  library="/owner/repo"
  position="anchor"
  preset="glass"
  customTrigger
  launcherLabel="Ask docs"
  onQuestion={(detail) => console.log(detail.question)}
/>

<button onclick={() => widget.send('Show the recommended setup')}>Ask programmatically</button>
```

`customTrigger` supports four modes: omit it for the built-in launcher, pass `true` for a Svelte-managed button, pass an element id or CSS selector for an external trigger, or pass an `Element`. Use a Svelte 5 snippet to customize the managed trigger:

```svelte
<Context7Widget library="/owner/repo" customTrigger>
  {#snippet trigger({ label })}
    <span aria-hidden="true">?</span> {label}
  {/snippet}
</Context7Widget>
```

Component bindings expose `open`, `close`, `toggle`, `send`, `cancel`, `retry`, `reset`, `isOpen`, `isBusy`, `getMessages`, and `subscribe`.

### Reactive controller

`createContext7Widget` can own a programmatic widget or control a registered component by `widgetId`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { createContext7Widget } from '@desource/context7-widget-svelte';
  import '@desource/context7-widget-svelte/styles.css';

  const docs = createContext7Widget({
    library: '/owner/repo',
    position: 'center',
    preset: 'terminal'
  });

  onMount(() => {
    docs.mount();
    return docs.unmount;
  });
</script>

<button onclick={() => docs.open()}>Open docs</button><p>{docs.messages.length} messages</p>
```

The controller exposes reactive `element`, `isOpenState`, `isBusyState`, and `messages` getters plus the full imperative API. `mount(overrides)` creates or updates one owned widget; `update(options)` applies live options without replacing it.

## Customization

Every shared option is supported: `library`, `theme`, `preset`, `position`, `color`, `customTrigger`, `backdrop`, `closeOnOutsideClick`, `defaultOpen`, `initialMessage`, `labels`, `launcherLabel`, `launcherVariant`, `linkBaseUrl`, `panelHeight`, `panelWidth`, `placeholder`, `title`, and `widgetId`.

Use `labels` for localized visible and assistive text. Relative Markdown links resolve against the Context7 library page unless `linkBaseUrl` supplies another documentation origin.

The component renders native Svelte light DOM. Customize stable classes or `part` attributes below `.context7-widget`, and set design tokens on that root:

```css
.context7-widget {
  --c7-accent: #7c3aed;
  --c7-font-family: Inter, system-ui, sans-serif;
}

.context7-widget [part~='panel'] {
  border-color: color-mix(in srgb, var(--c7-accent), transparent 65%);
}

.context7-widget-trigger {
  --c7-trigger-background: #7c3aed;
  --c7-trigger-radius: 10px;
}
```

Callback props are `onReady`, `onOpen`, `onClose`, `onCancel`, `onQuestion`, `onFirstToken`, `onAnswer`, `onAnswerComplete`, `onToolCall`, `onToolResult`, and `onError`. Consumer callback failures are reported without corrupting widget state or skipping state listeners.

## UX and accessibility

The composer supports multiline input: Enter sends and Shift+Enter inserts a newline. During streaming, Send becomes an enabled Stop action. Completed answers and code blocks have explicit copy actions, errors expose retry, and cancelling preserves partial answers. Reader-aware scrolling follows new output only while the conversation stays near the bottom.

Triggers synchronize `aria-controls`, `aria-expanded`, and `aria-haspopup`. Centered dialogs trap focus, isolate background content, and lock page scrolling; corner and anchored panels remain non-modal. External trigger attributes are restored after unmount.

## Data flow and privacy

The browser sends the library id and conversation messages directly to `https://context7.com/api/v2/widget/chat`. DeSource Labs does not proxy chat content. The package adds no analytics, cookies, or persistent browser storage. Do not send secrets or sensitive personal data; review Context7 policies for backend processing and retention.

## Packaging

The package uses Svelte 5 runes and the official `svelte` export condition. Imports are SSR-safe; DOM work starts only on component mount or explicit controller `mount()`. Svelte and `@desource/context7-widget/kit` remain external dependencies for consumer deduplication. Styles are separate, and tree-shaking metadata marks only CSS as side-effectful.
