# @desource/context7-widget-react

Native React bindings for the customizable Context7 documentation chat widget.
The package renders React DOM and uses React lifecycle semantics; it does not
wrap the core custom element. Request state, transport, safe Markdown, option
defaults, and public contracts come from `@desource/context7-widget/kit`.

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

const docs = useContext7Widget({
  autoMount: true,
  library: '/owner/repo',
  position: 'center',
  preset: 'terminal',
  widgetId: 'docs'
});

await docs.send('Show the recommended setup');
docs.cancel();
await docs.retry();
docs.reset();
```

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
