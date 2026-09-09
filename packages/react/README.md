# @desource/context7-widget-react

[![React](https://img.shields.io/npm/v/@desource/context7-widget-react?color=blue&logo=react)](https://www.npmjs.com/package/@desource/context7-widget-react)
[![Coverage](https://codecov.io/gh/DeSource-Labs/context7-widget/branch/main/graph/badge.svg)](https://codecov.io/gh/DeSource-Labs/context7-widget)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=DeSource-Labs_context7-widget&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DeSource-Labs_context7-widget)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/DeSource-Labs/context7-widget/blob/main/LICENSE)

Make Context7 docs chat look at home in your React app. Match your design with
presets and CSS, open it from your own help button, and control it through React
props, refs, or a hook.

## Why Use This Widget?

Context7 provides its docs widget and hosted AI answers for free. This project
adds a customizable interface around that service.

The official widget’s basic styling options can leave chat looking out of place
on a carefully designed site. This package adds control over those details:
custom fonts and spacing, flexible placement, copyable code, multiline input,
and Stop and Retry actions.

If you use the official widget, [replace its script URL](https://github.com/DeSource-Labs/context7-widget#existing-context7-widget-user)
or adopt the native React component below. Keep your existing Context7 library
and domain settings. For a new integration, put docs help where visitors are
choosing your library or working through setup.

React owns rendering and lifecycle. The shared core kit handles conversation
state, transport, Markdown, and defaults.

## Before You Start

Use a library you have claimed on Context7. In its **Admin → Chat** settings,
enable the widget, add your site's domain to the allowed domains, and save.
Replace `/owner/repo` in the examples with that library's id. A library being
indexed alone does not enable chat on your site.
See [Context7's widget setup](https://context7.com/docs/howto/chat-widget).

## Install

```bash
npm install @desource/context7-widget-react
```

Import the stylesheet once:

```ts
import '@desource/context7-widget-react/styles.css';
```

## Component

```tsx
import { useRef } from 'react';
import { Context7Widget, type Context7WidgetHandle } from '@desource/context7-widget-react/component';
import '@desource/context7-widget-react/styles.css';

export function DocsAssistant() {
  const widget = useRef<Context7WidgetHandle>(null);

  return (
    <Context7Widget
      ref={widget}
      library="/owner/repo"
      position="anchor"
      preset="glass"
      customTrigger
      launcherLabel="Ask docs"
      onQuestion={(detail) => console.log(detail.question)}
    />
  );
}
```

`customTrigger` supports four modes: omit it for the built-in floating
launcher, pass `true` for a React-managed button, pass an element id or CSS
selector for an external trigger, or pass an `Element`/React ref. A function in
the `trigger` prop can render custom contents inside the managed button.

## Controlled Open State

Omit `open` for internal state initialized by `defaultOpen`. Use `open` and
`onOpenChange` when application state owns the dialog:

```tsx
const [docsOpen, setDocsOpen] = useState(false);

<Context7Widget library="/owner/repo" open={docsOpen} onOpenChange={setDocsOpen} />;
```

`onOpen` and `onClose` are lifecycle notifications emitted after an actual
transition; `onOpenChange` is the controlled-state request.

## Hook

`useContext7Widget` controls the newest React widget registered for its
`widgetId`, or it can own a programmatically mounted React root:

```tsx
import { useContext7Widget } from '@desource/context7-widget-react/hook';
import '@desource/context7-widget-react/styles.css';

export function DocsHelp() {
  const docs = useContext7Widget({
    autoMount: true,
    library: '/owner/repo',
    position: 'center',
    preset: 'terminal',
    widgetId: 'docs'
  });

  return (
    <button type="button" disabled={!docs.widget} onClick={() => void docs.send('Show the recommended setup')}>
      Explain setup
    </button>
  );
}
```

Automatic mounting happens after the owner mounts. Call `send`, `open`, and
other controls from an event handler or after the widget is ready.

The hook returns `widget`, `isOpen`, `isBusy`, and `messages`, plus `mount`,
`unmount`, `open`, `close`, `toggle`, `send`, `cancel`, `retry`, `reset`, and
`getMessages`. `mount(overrides)` creates or updates an owned React widget.
Every hook option remains reactive, including React children, trigger content,
root props, and callbacks; explicit `mount(overrides)` values persist across
those updates. Owned widgets are removed with their owner unless
`removeOnUnmount` is `false`.

The registry is package-level, not based on React or DOM ancestry. `widgetId`
defaults to `default`; when no `default` registration exists, that lookup falls
back to the first available registered widget for single-widget applications.
Duplicate ids form a stack: the newest registration wins, and unmounting it
restores the previous registration.

## Examples

Use a controlled widget when application state owns visibility:

```tsx
import { useState } from 'react';
import { Context7Widget } from '@desource/context7-widget-react/component';
import '@desource/context7-widget-react/styles.css';

export function DocsHelp() {
  const [open, setOpen] = useState(false);

  return (
    <Context7Widget
      library="/owner/repo"
      open={open}
      onOpenChange={setOpen}
      position="center"
      backdrop
      preset="glass"
      customTrigger
    />
  );
}
```

Use `useContext7Widget({ autoMount: true })` for route actions, command
palettes, or other flows that need imperative control without placing a
component in the current tree. More runnable patterns are available in the
[demo gallery](https://context7.desourcelabs.com/examples).

## Props, Events, And Localization

The component accepts the shared options: `library`, `theme`, `preset`,
`position`, `color`, `customTrigger`, `backdrop`, `closeOnOutsideClick`,
`defaultOpen`, `initialMessage`, `labels`, `launcherLabel`, `launcherVariant`,
`linkBaseUrl`, `panelHeight`, `panelWidth`, `placeholder`, `title`, and
`widgetId`.

Use `labels` to override any user-facing or assistive string, including
attribution and library fallbacks. `Context7WidgetLabels` is exported for typed
dictionaries. Relative Markdown links resolve against the Context7 library
page by default; set `linkBaseUrl` to use your own documentation origin.

Lifecycle and stream callbacks are `onReady`, `onOpen`, `onClose`, `onCancel`,
`onQuestion`, `onFirstToken`, `onAnswer`, `onAnswerComplete`, `onToolCall`,
`onToolResult`, and `onError`. Every callback receives the typed detail object.

A component ref exposes `open`, `close`, `toggle`, `send`, `cancel`, `retry`,
`reset`, `isOpen`, `isBusy`, `getMessages`, and `subscribe`. While a request is
active, the multiline composer becomes read-only and its Send action becomes an
enabled Stop action. Enter sends; Shift+Enter inserts a newline.
Streaming follows the newest content while the conversation is near the
bottom, preserves the reader's position after they scroll upward, and resumes
when they return to the bottom or reset the conversation.

State listeners registered through `subscribe` are isolated from one another.
If one throws, the error is reported without corrupting the request or skipping
the remaining listeners.

## Data Flow And Privacy

The browser posts the configured library id and current conversation messages
directly to `https://context7.com/api/v2/widget/chat`. DeSource Labs does not
proxy chat content. The package adds no analytics, cookies, or persistent
browser storage; conversation state remains in the mounted widget until
`reset()` or unmount. Callback payloads expose questions and answers to the host
application, so any logging, analytics, or persistence added there is the
integrator's data flow. Do not send secrets or sensitive personal data, and
review Context7's policies for backend processing and retention.

## Customization

The component renders native light DOM under `.context7-widget`. Apply shared
CSS variables to that root and use `[part~='send-button']`-style selectors for
stable component parts. Managed trigger tokens use `--c7-trigger-background`,
`--c7-trigger-border`, `--c7-trigger-color`, `--c7-trigger-focus`,
`--c7-trigger-radius`, and `--c7-trigger-shadow`.

```css
.context7-widget.docs-assistant {
  --c7-accent: #7cffb2;
  --c7-panel-background: #101513;
  --c7-panel-color: #f7f2e8;
  --c7-panel-radius: 8px;
}

.context7-widget.docs-assistant [part~='send-button'] {
  min-width: 5rem;
}
```

Pass `rootProps={{ className: 'docs-assistant' }}` to scope these overrides. See the
[live customization guide](https://context7.desourcelabs.com/customization)
for every public token and part.

### Packaging

The package is ESM-only and SSR-import safe:

| Entry                                        | Contents                                                        |
| -------------------------------------------- | --------------------------------------------------------------- |
| `@desource/context7-widget-react/component`  | `Context7Widget` and component types; does not import React DOM |
| `@desource/context7-widget-react/hook`       | `useContext7Widget`; requires React DOM for owned roots         |
| `@desource/context7-widget-react`            | Compatibility entry exporting both surfaces                     |
| `@desource/context7-widget-react/styles.css` | Minified widget and managed-trigger styles                      |

Prefer `/component` when you only render `Context7Widget`. `react-dom` is an
optional peer for that isolated entry and is required by `/hook` and by the
package root, which also exports the hook. React, React DOM, and the core kit
remain external so applications can deduplicate them. Rendering or
programmatic mounting still requires a browser document. Every JavaScript
entry and shared chunk preserves the React `"use client"` boundary for React
Server Component and Next.js App Router consumers.

## Related packages

- [`@desource/context7-widget`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/core) provides the browser custom element, drop-in script, TypeScript helpers, and shared headless engine.
- [`@desource/context7-widget-vue`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/vue) provides a native Vue 3 component, composable, plugin defaults, and custom trigger slots.
- [`@desource/context7-widget-nuxt`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/nuxt) adds auto-imports, automatic styles, and app-wide defaults for Nuxt 3 and 4.
- [`@desource/context7-widget-svelte`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/svelte) provides a native Svelte 5 component, bindable open state, trigger snippets, and a reactive controller.
- [`@desource/context7-widget-angular`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/angular) provides a standalone Angular component, signals, application defaults, and injectable controls.
