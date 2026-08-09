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
import { Context7Widget, type Context7WidgetHandle } from '@desource/context7-widget-react';
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

`useContext7Widget` controls the nearest registered widget by `widgetId`, or it
can own a programmatically mounted React root:

```tsx
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
Owned widgets are removed with their owner unless `removeOnUnmount` is `false`.

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

## Styling And Packaging

The component renders native light DOM under `.context7-widget`. Apply shared
CSS variables to that root and use `[part~='send-button']`-style selectors for
stable component parts. Managed trigger tokens use `--c7-trigger-background`,
`--c7-trigger-border`, `--c7-trigger-color`, `--c7-trigger-focus`,
`--c7-trigger-radius`, and `--c7-trigger-shadow`.

The package is ESM-only and SSR-import safe. React, React DOM, and the core kit
are external dependencies so an application can deduplicate them and
tree-shake unused modules. Rendering or programmatic mounting still requires a
browser document.
