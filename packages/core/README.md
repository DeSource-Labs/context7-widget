# @desource/context7-widget

Core TypeScript package for the DeSource Labs Context7 widget.

```bash
pnpm add @desource/context7-widget
```

```ts
import {
  buildContext7WidgetScriptTag,
  mountContext7Widget
} from "@desource/context7-widget";

mountContext7Widget({
  library: "/vercel/next.js",
  color: "#10b981",
  theme: "auto",
  position: "center",
  preset: "glass",
  backdrop: true,
  closeOnOutsideClick: true
});

const script = buildContext7WidgetScriptTag({
  library: "/vercel/next.js",
  customTrigger: "#docs-chat",
  hideDefaultButton: true,
  position: "anchor",
  anchorPlacement: "bottom-end"
});
```

Exports include the `context7-widget` custom element, script loader helpers,
stream transport, markdown renderer, typed widget options, event payload types,
and `./widget.js` for script hosting.

Supported presets are `default`, `minimal`, `glass`, `neo`, `terminal`, and
`brutalist`. Supported positions are fixed corners, `center`, and
`anchor` for trigger-attached popovers.
