# Integration

## Drop-In Replacement

Official Context7:

```html
<script
  async
  src="https://context7.com/widget.js"
  data-library="/vercel/next.js"
></script>
```

Replacement:

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
></script>
```

Keep your Context7 allowed-domain configuration unchanged. The browser request
still goes to Context7 by default.

## Core TypeScript

```ts
import {
  defineContext7Widget,
  mountContext7Widget,
  buildContext7WidgetScriptTag
} from "@desource/context7-widget";

defineContext7Widget();

mountContext7Widget({
  library: "/vercel/next.js",
  theme: "auto",
  position: "bottom-right"
});

const script = buildContext7WidgetScriptTag({
  library: "/vercel/next.js",
  color: "#10b981"
});
```

## Vue

```vue
<template>
  <Context7Widget
    library="/vercel/next.js"
    color="#10b981"
    custom-trigger="#docs-chat"
    hide-default-button
    @question="trackQuestion"
    @answer-complete="trackAnswer"
  />
</template>

<script setup lang="ts">
import { Context7Widget } from "@desource/context7-widget-vue";
</script>
```

Composable:

```ts
import { useContext7Widget } from "@desource/context7-widget-vue";

const docs = useContext7Widget({
  autoMount: true,
  library: "/vercel/next.js",
  widgetId: "docs"
});

docs.open();
await docs.send("Show middleware examples");
```

## Next.js App Router

Add the script in `app/layout.tsx`:

```tsx
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://context7.desource-labs.org/widget.js"
          data-library="/vercel/next.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

## Docusaurus

Add the script in `docusaurus.config.js`:

```js
export default {
  scripts: [
    {
      src: "https://context7.desource-labs.org/widget.js",
      async: true,
      "data-library": "/facebook/docusaurus"
    }
  ]
};
```

## Custom Trigger

```html
<button id="docs-chat">Ask docs</button>

<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
  data-custom-trigger="#docs-chat"
  data-hide-default-button="true"
></script>
```

## Analytics

```js
document.addEventListener("c7:question", (event) => {
  analytics.track("Context7 Question", {
    library: event.detail.library,
    question: event.detail.question,
    widgetId: event.detail.widgetId
  });
});

document.addEventListener("c7:answer-complete", (event) => {
  analytics.track("Context7 Answer Complete", {
    answerLength: event.detail.answer.length,
    library: event.detail.library
  });
});
```

## CSP

For the default hosted script and Context7 backend:

```http
Content-Security-Policy:
  script-src 'self' https://context7.desource-labs.org;
  connect-src 'self' https://context7.com;
```

If you host the script elsewhere or use `data-api-url`, add those origins.
