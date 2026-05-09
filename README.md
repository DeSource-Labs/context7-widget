# Context7 Widget

A themeable, Context7-compatible chat widget for teams that want the official
`https://context7.com/widget.js` install path, but need the UI to feel native
inside polished product and documentation sites.

The goal is intentionally narrow:

- keep migration to a one-line script URL replacement;
- keep the Context7 hosted chat protocol as the default backend;
- expose durable styling hooks through CSS custom properties and shadow parts;
- expose DOM events and a small imperative API for analytics and app logic;
- monitor upstream `widget.js` changes so compatibility work is visible.

## Quick Start

Replace the official script URL and keep the existing Context7 attributes:

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
></script>
```

Existing official attributes continue to work:

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
  data-color="#111827"
  data-position="bottom-right"
  data-placeholder="Ask about the docs..."
></script>
```

The widget still calls `https://context7.com/api/v2/widget/chat` by default.
Use `data-api-url` only if you intentionally run a compatible proxy:

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
  data-api-url="https://context7.com"
></script>
```

## Styling

You can theme through CSS custom properties:

```css
context7-widget {
  --c7-accent: #ef4444;
  --c7-font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  --c7-panel-background: #050505;
  --c7-panel-color: #f8fafc;
  --c7-border-color: rgba(255, 255, 255, 0.16);
  --c7-panel-radius: 6px;
  --c7-launcher-radius: 0;
}
```

Or through shadow parts when your design system needs direct component styling:

```css
context7-widget::part(panel) {
  box-shadow: none;
}

context7-widget::part(send-button) {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

Important parts: `launcher`, `panel`, `header`, `title`, `close-button`,
`messages`, `message`, `user-message`, `assistant-message`, `error-message`,
`tool-call`, `composer`, `input`, `send-button`, `footer`, and `powered-by`.

## Events And API

The host element dispatches composed DOM events:

- `c7:ready`
- `c7:open`
- `c7:close`
- `c7:question`
- `c7:first-token`
- `c7:answer`
- `c7:answer-complete`
- `c7:tool-call`
- `c7:tool-result`
- `c7:error`

Example:

```js
document.addEventListener("c7:question", (event) => {
  console.log("Context7 question", event.detail.question);
});
```

The auto-loader also registers `window.Context7Widget`:

```js
window.Context7Widget.open();
window.Context7Widget.send("How do I configure middleware?");
window.Context7Widget.close();
```

Use `data-custom-trigger` and `data-hide-default-button` to connect the widget
to your own UI:

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

## Local Development

```bash
npm install
npm run build
npm test
```

Open `examples/themed.html` after building to inspect the local bundle.

## Maintenance

The daily upstream scanner downloads `https://context7.com/widget.js`, stores the
latest raw script in `upstream/context7-widget.latest.js`, and opens a GitHub
issue when the upstream hash changes. Functional compatibility still depends on
Context7's hosted backend, so behavior changes can happen without a script diff.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the project boundaries and
[docs/INTEGRATION.md](docs/INTEGRATION.md) for integration recipes.
