# Architecture

This project is a client layer for Context7 documentation chat, not a
replacement for Context7's hosted backend. The browser widget defaults to the
same hosted chat endpoint used by the official widget:

```text
https://context7.com/api/v2/widget/chat
```

That boundary is intentional. Context7 owns library claiming, allowed-domain
validation, retrieval, model behavior, and the streaming protocol. This
repository owns the product-facing client experience: loader, custom element,
styling contract, typed helpers, Vue bindings, Nuxt demo site, events, and
compatibility monitoring.

## Workspace Deliverables

- `packages/core/dist/widget.js`: zero-build browser loader for script-tag replacement.
- `packages/core/dist/index.js` plus preserved internal ESM modules: tree-shakeable
  core TypeScript build for custom integrations.
- `context7-widget` custom element: the framework-agnostic core runtime surface.
- `packages/vue`: Vue 3 component, composable, plugin helper, and SCSS output.
- planned framework packages: Nuxt, React, Svelte, and Angular implementations
  built on the shared kit.
- `demo`: Nuxt static site for `context7.desource-labs.org`.
- `scripts/scan-upstream.mts`: daily upstream byte and hash monitor.
- GitHub Actions: monorepo CI, Vercel site build check, and scheduled scanner.

## Runtime Shape

The auto-loader reads the current script tag:

```html
<script async src="https://context7.desource-labs.org/widget.js" data-library="/owner/repo"></script>
```

It creates:

```html
<context7-widget library="/owner/repo"></context7-widget>
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
- `data-welcome-message`

It also adds:

- `data-backdrop`
- `data-close-on-outside-click`
- `data-custom-trigger`
- `data-default-open`
- `data-initial-message`
- `data-launcher-label`
- `data-launcher-variant`
- `data-panel-height`
- `data-panel-width`
- `data-preset`
- `data-theme`
- `data-title`
- `data-widget-id`

The chat backend is fixed to `https://context7.com`, not the script origin. This
is what makes replacing only `https://context7.com/widget.js` with
`https://context7.desource-labs.org/widget.js` work.

## Package Boundaries

`@desource/context7-widget` owns the browser-native integration:

- the custom element;
- script mounting;
- framework-agnostic helper functions.

`@desource/context7-widget/kit` is the shared, rendering-independent layer:

- Context7 API transport and stream compatibility;
- markdown and HTML safety helpers;
- pure anchored-panel layout calculation;
- option, message, event, and tool-call contracts;
- shared defaults and brand assets.

`@desource/context7-widget-vue` depends on the kit instead of the core custom
element. It owns:

- native Vue DOM rendering and reactive conversation state;
- Vue lifecycle, focus, trigger, and positioning behavior;
- typed Vue props, emits, slots, and exposed methods;
- a composable that mounts and controls the Vue component;
- an optional plugin helper;
- SCSS-built widget styles.

Future React, Svelte, and Angular packages should follow the Vue boundary: own
their framework UI and lifecycle, share backend/protocol code through `/kit`,
and never wrap the core custom element.

Both implementations always show compact linked attribution for Context7 and
DeSource Labs. Attribution is part of the product contract rather than a
configurable display option.

Core and Vue compile their widget selectors from
`common/styles/_widget.scss`. Core scopes the mixin to `:host`; Vue scopes it to
`.context7-widget` and adds only its managed-trigger styles. This keeps the
visual contract in one source of truth without making Vue depend on the custom
element runtime. Core normalizes Sass's nested host-attribute output to
functional selectors such as `:host([open])`, which are exercised in Chromium
against the real Shadow DOM.

## Runtime Invariants

- The ESM package roots do not auto-register or auto-mount anything.
- Only `@desource/context7-widget/widget.js` boots from its script element.
- Core ESM preserves source module boundaries so helper-only consumers do not
  retain the custom-element runtime.
- A cancelled request cannot append late frames or clear the busy state of a
  newer request.
- Stream callbacks still emit every chunk, while DOM Markdown work is limited
  to one render per animation frame.
- Changing libraries cancels the active request and starts a fresh
  conversation, preventing cross-library history leakage.
- Core shares a constructable stylesheet across widget instances where
  supported and retains an inline fallback.
- External trigger ARIA attributes are restored when a widget disconnects or
  changes triggers.
- Centered modal focus is contained inside the panel, not the launcher or host
  page.

## Styling Contract

CSS custom properties are the safest customization layer in every package. Core
also exposes shadow parts; framework packages expose native framework DOM and
document their root selector.

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
- `c7:cancel`
- `c7:question`
- `c7:first-token`
- `c7:answer`
- `c7:answer-complete`
- `c7:tool-call`
- `c7:tool-result`
- `c7:error`

Every event includes `detail.library`, `detail.widgetId`, and `detail.widget`.
Question, answer, and cancel events include the current message payload where
relevant. Cancelling after answer tokens arrive preserves that visible partial
assistant message in public conversation state with `status: 'cancelled'`.

## Site Hosting

`demo` is a Nuxt static app. Its build runs the core and Vue package builds,
copies `packages/core/dist/widget.js` to `demo/public/widget.js`, then generates
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
