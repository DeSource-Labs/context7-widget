# @desource/context7-widget-svelte

[![Svelte](https://img.shields.io/npm/v/@desource/context7-widget-svelte?color=blue&logo=svelte)](https://www.npmjs.com/package/@desource/context7-widget-svelte)
[![Coverage](https://codecov.io/gh/DeSource-Labs/context7-widget/branch/main/graph/badge.svg)](https://codecov.io/gh/DeSource-Labs/context7-widget)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=DeSource-Labs_context7-widget&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DeSource-Labs_context7-widget)
[![Context7 Docs](https://img.shields.io/badge/context7-DOCS-blue.svg?logo=data:image/svg%2bxml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCAyOCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDBINEMxLjc5MDg2IDAgMCAxLjc5MDg2IDAgNFYyNEMwIDI2LjIwOTEgMS43OTA4NiAyOCA0IDI4SDI0QzI2LjIwOTEgMjggMjggMjYuMjA5MSAyOCAyNFY0QzI4IDEuNzkwODYgMjYuMjA5MSAwIDI0IDBaIiBmaWxsPSIjRjdGMkU4IiBmaWxsLW9wYWNpdHk9IjAuNjUiLz4KPHBhdGggZD0iTTEwLjYgMTUuMjk5MkMxMC42IDE3LjQ5OTIgOS43MDAwNSAxOS4zOTkyIDguMjAwMDUgMjEuMDk5MkgxMS42VjIyLjc5OTJINi4zMDAwNVYyMS4xOTkyQzguMDAwMDUgMTkuMzk5MiA4LjYwMDA1IDE3Ljg5OTIgOC42MDAwNSAxNS4yOTkySDEwLjZaTTE3LjQgMTUuMjk5MkMxNy40IDE3LjQ5OTIgMTguMyAxOS4zOTkyIDE5LjggMjEuMDk5MkgxNi40VjIyLjc5OTJIMjEuN1YyMS4xOTkyQzIwIDE5LjM5OTIgMTkuNCAxNy44OTkyIDE5LjQgMTUuMjk5MkgxNy40Wk0xMC42IDEyLjY5OTJDMTAuNiAxMC40OTkyIDkuNzAwMDUgOC41OTkyMiA4LjIwMDA1IDYuODk5MjJIMTEuNlY1LjE5OTIySDYuMzAwMDVWNi43OTkyMkM4LjAwMDA1IDguNTk5MjIgOC42MDAwNSAxMC4wOTkyIDguNjAwMDUgMTIuNjk5MkgxMC42Wk0xNy40IDEyLjY5OTJDMTcuNCAxMC40OTkyIDE4LjMgOC41OTkyMiAxOS44IDYuODk5MjJIMTYuNFY1LjE5OTIySDIxLjdWNi43OTkyMkMyMCA4LjU5OTIyIDE5LjQgMTAuMDk5MiAxOS40IDEyLjY5OTJIMTcuNFoiIGZpbGw9ImJsYWNrIi8+Cjwvc3ZnPgo=)](https://context7.com/desource-labs/context7-widget)
[![Code Wiki](https://img.shields.io/badge/code-WIKI-blue?logo=googlegemini&logoColor=white)](https://codewiki.google/github.com/desource-labs/context7-widget)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/DeSource-Labs/context7-widget/blob/main/LICENSE)

Context7 documentation answers in a widget you can style for your Svelte app.
Use your own colors, type, and trigger content, with Svelte 5 snippets, bindable
state, and reactive controls.

## Why Use This Widget?

Context7 provides its docs widget and hosted AI answers for free. This project
adds customizable interface around that service.

The official Context7 widget offers basic visual settings. This version lets you
fit the assistant to a carefully designed site and adds the chat details visitors
use every day: multiline questions, copyable code, Stop, Retry, and scrolling
that leaves them in control.

[Upgrade an existing Context7 script](https://github.com/DeSource-Labs/context7-widget#existing-context7-widget-user)
or use the native component below with the same library and domain settings.
For a new site, give visitors a way to explore your library’s capabilities and
ask how to get started. Svelte handles rendering; the core kit shares the chat
engine, transport, Markdown, and layout helpers.

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

The component renders native Svelte light DOM. Style public `part` attributes below `.context7-widget`, and set CSS variables on that root:

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

## Related packages

- [`@desource/context7-widget`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/core) provides the browser custom element, drop-in script, TypeScript helpers, and shared headless engine.
- [`@desource/context7-widget-vue`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/vue) provides a native Vue 3 component, composable, plugin defaults, and custom trigger slots.
- [`@desource/context7-widget-nuxt`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/nuxt) adds auto-imports, automatic styles, and app-wide defaults for Nuxt 3 and 4.
- [`@desource/context7-widget-react`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/react) provides a native React component, controlled open state, a programmatic hook, and custom triggers.
- [`@desource/context7-widget-angular`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/angular) provides a standalone Angular component, signals, application defaults, and injectable controls.
