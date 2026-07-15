# Architecture

This project is a compatibility client, not a replacement for Context7's hosted
backend. The browser widget defaults to the same hosted chat endpoint used by
the official widget:

```text
https://context7.com/api/v2/widget/chat
```

That boundary keeps integration simple and maintenance realistic. The project
owns the client UX, styling contract, loader, typed helper APIs, Vue bindings,
Nuxt information site, event API, and compatibility monitoring. Context7 still
owns library claiming, allowed-domain validation, retrieval, model behavior, and
the streaming protocol.

## Workspace Deliverables

- `packages/core/dist/widget.js`: zero-build browser loader for script-tag replacement.
- `packages/core/dist/index.js`: core TypeScript module build for frameworks and custom
  integrations.
- `context7-widget` custom element: the canonical runtime surface.
- `packages/vue`: Vue 3 component, composable, plugin helper, and SCSS output.
- `apps/site`: Nuxt static site for `context7.desource-labs.org`.
- `scripts/scan-upstream.mjs`: daily upstream byte and hash monitor.
- GitHub Actions: monorepo CI, Vercel site build check, and scheduled scanner.

## Runtime Shape

The auto-loader reads the current script tag:

```html
<script
  async
  src="https://context7.desource-labs.org/widget.js"
  data-library="/vercel/next.js"
></script>
```

It creates:

```html
<context7-widget library="/vercel/next.js"></context7-widget>
```

The custom element attaches an open shadow root. Open shadow DOM is intentional:
host applications can inspect the element while stable customization should use
CSS custom properties, `::part()`, attributes, events, and the global API.

The core package is import-safe during SSR, but widget creation and mounting are
browser-only operations.

## Compatibility Contract

The loader supports the official attributes:

- `data-library`
- `data-color`
- `data-position`
- `data-placeholder`

It also adds:

- `data-api-url`
- `data-theme`
- `data-title`
- `data-initial-message`
- `data-custom-trigger`
- `data-hide-default-button`
- `data-widget-id`

The default `data-api-url` is `https://context7.com`, not the script origin. This
is what makes replacing only `https://context7.com/widget.js` with
`https://context7.desource-labs.org/widget.js` work.

## Package Boundaries

`packages/core` / `@desource/context7-widget` owns:

- the custom element;
- script mounting;
- stream transport compatibility;
- markdown rendering;
- DOM event names and payload types;
- framework-agnostic helper functions.

`@desource/context7-widget-vue` owns:

- a typed `Context7Widget` Vue component;
- a `useContext7Widget` composable;
- an optional plugin helper;
- Vue event mapping from `c7:*` DOM events;
- SCSS-built convenience styles.

The Vue package depends on the core package and does not duplicate widget
transport, styling, or loader internals.

## Styling Contract

CSS custom properties are the safest customization layer. They are inherited by
the custom element and do not depend on internal DOM shape.

Shadow parts are available when design systems need direct styling:

- `backdrop`
- `launcher`
- `panel`
- `header`
- `title`
- `close-button`
- `messages`
- `message`
- `user-message`
- `assistant-message`
- `error-message`
- `typing`
- `tool-call`
- `tool-toggle`
- `composer`
- `input`
- `send-button`
- `footer`
- `powered-by`

Internal class names are not public API.

## Event Contract

Events bubble and are composed, so host pages can listen at `document` level:

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

Every event includes `detail.library`, `detail.widgetId`, and `detail.widget`.
Question and answer events include the current message payload where relevant.

## Site Hosting

`apps/site` is a Nuxt static app. Its build runs the core and Vue package builds,
copies `packages/core/dist/widget.js` to `apps/site/public/widget.js`, then generates
`.output/public`. `vercel.json` points Vercel at that output directory.

## Maintenance Strategy

The scheduled scanner watches the official unversioned widget script. It stores
the latest raw script, a normalized copy, metadata, and a SHA-256 hash under
`upstream/`. Git history becomes the long-term diff.

The scanner creates or comments on an open GitHub issue when the hash changes.
The issue is a prompt to check:

- request body compatibility;
- stream frame compatibility;
- tool-call and tool-result frame compatibility;
- user-visible error behavior;
- styling or layout assumptions worth preserving.

Backend behavior can change without a `widget.js` diff, so the scanner does not
replace manual smoke testing against a claimed library and allowed domain.
