# @desource/context7-widget-angular

[![Angular](https://img.shields.io/npm/v/@desource/context7-widget-angular?color=blue&logo=angular&logoColor=white)](https://www.npmjs.com/package/@desource/context7-widget-angular)
[![Coverage](https://codecov.io/gh/DeSource-Labs/context7-widget/branch/main/graph/badge.svg)](https://codecov.io/gh/DeSource-Labs/context7-widget)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=DeSource-Labs_context7-widget&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DeSource-Labs_context7-widget)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/DeSource-Labs/context7-widget/blob/main/LICENSE)

Bring Context7 documentation answers into your Angular app with a widget that
matches its design. Customize fonts, colors, layout, and trigger content through
a native standalone component.

## Why Use This Widget?

Context7 provides its docs widget and hosted AI answers for free. This project
adds a free, customizable interface around that service.

You should be able to add docs chat without settling for a generic panel on a
carefully designed site. This package expands the official Context7 widget’s
visual controls and adds multiline input, answer and code copying, Stop, Retry,
and scrolling that respects the reader’s position.

Existing Context7 users can [replace the script URL](https://github.com/DeSource-Labs/context7-widget#existing-context7-widget-user)
or adopt this component with the same library and domain settings. New users can
put documentation answers into product pages and onboarding, helping visitors
understand the library and try their first integration.

The component uses `OnPush`, signal inputs, and typed outputs. Configure app
defaults with `provideContext7Widget` and use the injectable service for
programmatic controls. The shared core kit handles conversation state,
transport, Markdown, and layout.

## Before You Start

Use a library you have claimed on Context7. In its **Admin → Chat** settings,
enable the widget, add your site's domain to the allowed domains, and save.
Replace `/owner/repo` in the examples with that library's id. A library being
indexed alone does not enable chat on your site.
See [Context7's widget setup](https://context7.com/docs/howto/chat-widget).

## Install

```bash
npm install @desource/context7-widget-angular
```

Import the stylesheet once in the application build:

```css
@import '@desource/context7-widget-angular/styles.css';
```

Angular 22 is required.

## Component

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Context7Widget, type Context7WidgetQuestionEventDetail } from '@desource/context7-widget-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Context7Widget],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <context7-widget
      library="/owner/repo"
      position="anchor"
      preset="glass"
      theme="auto"
      (question)="trackQuestion($event)"
    />
  `
})
export class App {
  trackQuestion(detail: Context7WidgetQuestionEventDetail): void {
    console.log(detail.library, detail.question);
  }
}
```

The component exposes `open`, `close`, `toggle`, `send`, `cancel`, `retry`,
`reset`, `isOpen`, `isBusy`, `getMessages`, and `subscribe` through a
`viewChild(Context7Widget)` reference.

## Application defaults

`provideContext7Widget` supplies defaults without creating another widget:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideContext7Widget } from '@desource/context7-widget-angular';
import { App } from './app';

bootstrapApplication(App, {
  providers: [
    provideContext7Widget({
      launcherLabel: 'Ask docs',
      preset: 'glass',
      theme: 'auto'
    })
  ]
});
```

Explicit component inputs override provided defaults.

## Injectable controls

`Context7WidgetService` resolves declarative widgets by `widgetId` and exposes
reactive `widget`, `widgetId`, `isOpen`, `isBusy`, and `messages` signals.

```ts
import { Component, inject } from '@angular/core';
import { Context7WidgetService } from '@desource/context7-widget-angular';

@Component({
  selector: 'docs-actions',
  standalone: true,
  template: `<button type="button" (click)="ask()">Explain setup</button>`
})
export class DocsActions {
  readonly docs = inject(Context7WidgetService);

  async ask(): Promise<void> {
    this.docs.select('docs');
    this.docs.open();
    await this.docs.send('How do I configure the widget?');
  }
}
```

The service can own a dynamically mounted Angular component:

```ts
const widget = docs.mount({
  library: '/owner/repo',
  position: 'center',
  preset: 'terminal',
  target: '#widget-root',
  widgetId: 'docs'
});

await widget.send('Show the installation steps.');
docs.unmount('docs');
```

Calling `mount` again with the same `widgetId` updates and relocates the owned
component. `unmount` never removes a component declared in a template.
Programmatic mounting requires a browser document.

## Examples

### Controlled visibility

Use Angular two-way binding when the parent owns visibility:

```ts
import { Component, signal } from '@angular/core';
import { Context7Widget } from '@desource/context7-widget-angular';

@Component({
  selector: 'docs-shell',
  standalone: true,
  imports: [Context7Widget],
  template: `
    <button type="button" (click)="docsOpen.set(true)">Open docs</button>
    <context7-widget [(open)]="docsOpen" library="/owner/repo" position="center" [backdrop]="true" />
  `
})
export class DocsShell {
  readonly docsOpen = signal(false);
}
```

Omit `open` to initialize internal visibility from `defaultOpen`.

### Managed trigger content

Import `Context7WidgetTrigger` when projecting a product-specific trigger:

```ts
import { Component } from '@angular/core';
import { Context7Widget, Context7WidgetTrigger } from '@desource/context7-widget-angular';

@Component({
  standalone: true,
  imports: [Context7Widget, Context7WidgetTrigger],
  template: `
    <context7-widget library="/owner/repo" [customTrigger]="true">
      <span context7WidgetTrigger>Ask product docs</span>
    </context7-widget>
  `
})
export class ProductDocs {}
```

### External trigger

```html
<button id="docs-help" type="button">Ask docs</button>
<context7-widget library="/owner/repo" customTrigger="docs-help" />
```

An id may include or omit `#`. Full CSS selectors, direct `Element` values,
and `ElementRef<Element>` values are also supported. Missing selectors leave
the built-in launcher visible and bind when the target enters the document.
The package restores authored trigger ARIA attributes when a trigger changes or
the widget is destroyed.

## Customization

The component renders native Angular DOM under `.context7-widget`; it does not
wrap the core custom element. Override shared CSS variables or public parts:

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

.context7-widget-trigger {
  --c7-trigger-background: #111827;
  --c7-trigger-color: #f8fafc;
  --c7-trigger-focus: rgba(124, 255, 178, 0.42);
  --c7-trigger-radius: 8px;
  --c7-trigger-shadow: none;
}
```

See the [live customization guide](https://context7.desourcelabs.com/customization)
for every public token and part.

## Inputs and outputs

The component accepts `library`, `theme`, `preset`, `position`, `color`,
`customTrigger`, `backdrop`, `closeOnOutsideClick`, `defaultOpen`,
`initialMessage`, `labels`, `launcherLabel`, `launcherVariant`, `linkBaseUrl`,
`panelHeight`, `panelWidth`, `placeholder`, `title`, `widgetId`, and controlled
`open`.

Outputs are `ready`, `opened`, `closed`, `cancelled`, `question`, `firstToken`,
`answer`, `answerComplete`, `toolCall`, `toolResult`, `error`, and `openChange`.
Each lifecycle or conversation output receives the same typed event detail used
by the core package. `openChange` receives the requested boolean state.

Use `labels` for partial localization of visible and assistive strings. Relative
Markdown links resolve against the Context7 library page unless `linkBaseUrl`
sets a documentation origin.

While a response streams, the send action becomes an enabled Stop action.
Enter sends, Shift+Enter inserts a newline, completed answers and fenced code
blocks expose copy actions, and transport failures expose retry. Reader-aware
autoscroll stops when someone moves up the conversation and resumes at the
bottom. Centered widgets trap focus, isolate outside content, and lock document
scrolling.

Duplicate `widgetId` registrations form a stack. Injectable controls resolve
the newest widget, then restore the previous registration after the newest one
is destroyed. A default lookup falls back to the first available widget when no
widget uses the `default` id.

## SSR and packaging

The ESM entry and declarations are safe to import during SSR. Declarative SSR
does not access browser globals; browser-only listeners, modal state, focus,
and trigger binding start after view initialization. `Context7WidgetService.mount`
and `unmount` are client-side ownership APIs.

Angular and `@desource/context7-widget/kit` remain external dependencies, so
applications can deduplicate Angular and tree-shake unused kit modules. Styles
ship separately at `@desource/context7-widget-angular/styles.css`.

## Data flow and privacy

The browser posts the configured library id and current conversation messages
directly to `https://context7.com/api/v2/widget/chat`. DeSource Labs does not
proxy chat content. The package adds no analytics, cookies, or persistent
browser storage. Emitted event details expose questions and answers to the host
application, so logging or persistence added by the application becomes part of
its data flow. Do not send secrets or sensitive personal data.

## Related packages

- [`@desource/context7-widget`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/core) provides the browser custom element, drop-in script, TypeScript helpers, and shared headless engine.
- [`@desource/context7-widget-vue`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/vue) provides a native Vue 3 component, composable, plugin defaults, and custom trigger slots.
- [`@desource/context7-widget-nuxt`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/nuxt) adds auto-imports, automatic styles, and app-wide defaults for Nuxt 3 and 4.
- [`@desource/context7-widget-react`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/react) provides a native React component, controlled open state, a programmatic hook, and custom triggers.
- [`@desource/context7-widget-svelte`](https://github.com/DeSource-Labs/context7-widget/tree/main/packages/svelte) provides a native Svelte 5 component, bindable open state, trigger snippets, and a reactive controller.
