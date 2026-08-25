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
styling contract, typed helpers, native Vue, React, Svelte, and Angular bindings,
the Nuxt module and demo site, events, and compatibility monitoring.

## Workspace Deliverables

- `packages/core/dist/widget.js`: zero-build browser loader for script-tag replacement.
- `packages/core/dist/index.js` plus preserved internal ESM modules: tree-shakeable
  core TypeScript build for custom integrations.
- `packages/core/dist/core.js`: framework-neutral public primitives for custom
  chat experiences.
- `packages/core/dist/kit.js`: the public framework-author contract used to
  implement native bindings.
- `context7-widget` custom element: the framework-agnostic core runtime surface.
- `packages/vue`: Vue 3 component, composable, plugin helper, and SCSS output.
- `packages/react`: native React component and controlled API at `/component`,
  programmatic mounting at `/hook`, a compatibility root, and SCSS output.
- `packages/svelte`: native Svelte 5 component, bindable state, snippets,
  reactive controller, and SCSS output.
- `packages/angular`: standalone OnPush component, signal state, injectable
  service, application defaults, trigger directive, and SCSS output.
- `packages/nuxt`: Nuxt 3/4 module that auto-imports the Vue component and
  composable, registers CSS, and provides serializable application defaults.
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
- `data-link-base-url`
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
- custom-element/script helpers and useful consumer types.

`@desource/context7-widget/core` is the supported custom-solution surface:

- conversation engine and renderer bridge;
- transport, safe Markdown, layout calculation, clipboard, modal isolation,
  localization defaults, and focused public contracts.

`@desource/context7-widget/kit` is the shared, rendering-independent layer:

- headless conversation engine for request state, history, cancellation, errors,
  tool frames, event payloads, and subscriptions;
- headless renderer bridge for engine-event routing, active partial-answer
  lifecycle, and shared tool-frame formatting;
- Context7 API transport and stream compatibility;
- markdown and HTML safety helpers;
- copy-action coordination for trimming, pending-write deduplication, feedback
  timing, repeat suppression, and stale async invalidation;
- pure anchored-panel layout calculation;
- option, message, event, and tool-call contracts;
- shared defaults and brand assets.

`@desource/context7-widget-vue`, `@desource/context7-widget-react`,
`@desource/context7-widget-svelte`, and
`@desource/context7-widget-angular` depend on the kit instead of the core custom
element. Each owns:

- native framework DOM rendering and display state;
- framework lifecycle, focus, trigger, and positioning behavior;
- idiomatic controlled state plus typed props/events and exposed controls;
- a framework-native composable, hook, controller, or service;
- SCSS-built widget styles.

Vue additionally owns typed slots and its plugin helper. Svelte owns snippets
and runes-based bindings. Angular owns DI defaults, an injectable controller,
and projected trigger content. None wraps the core custom element.

`@desource/context7-widget-nuxt` is deliberately different: it is a thin module
over the Vue adapter. Nuxt registers Vue entry points by package path, adds the
Vue stylesheet, and injects serializable defaults. It has no renderer,
conversation engine, transport, or copied Vue public type list.

React separates its component and hook entries so component-only consumers do
not retain `react-dom`; the package root remains a compatibility entry that
exports both surfaces. Each emitted React entry and shared chunk preserves
`"use client"` for React Server Component tooling.

All implementations always show compact linked attribution for Context7 and
DeSource Labs. Attribution is part of the product contract rather than a
configurable display option.

Core, Vue, React, Svelte, and Angular compile their widget selectors from
`common/styles/_widget.scss`. Core scopes the mixin to `:host`; framework
packages scope it to `.context7-widget`. Native framework packages also compile
their managed button from `common/styles/_framework-trigger.scss`. This keeps the
visual contract in one source of truth without making a framework package
depend on the custom-element runtime. Core normalizes Sass's nested
host-attribute output to selectors such as `:host([open])`, which are exercised
across the shared Playwright browser matrix against real Shadow DOM.

## Runtime Invariants

- The ESM package roots do not auto-register or auto-mount anything.
- Only `@desource/context7-widget/widget.js` boots from its script element.
- Core ESM preserves source module boundaries so helper-only consumers do not
  retain the custom-element runtime.
- `@desource/context7-widget/kit` owns the headless conversation engine:
  request identity, busy state, transport history, partial answers,
  cancellation, completion, errors, tool frames, event payloads, and state
  subscriptions.
- Framework renderers own native DOM, lifecycle, focus restoration, outside
  clicks, scrolling, trigger binding, and animation-frame rendering; they do
  not reimplement the request state machine or engine-event routing.
- Vue, Svelte, and Angular share the completed-answer Markdown cache from
  `/kit`; it uses display-item identity, so discarded conversations are not
  retained. React uses its native memoization boundary for the same work.
- A cancelled request cannot append late frames or clear the busy state of a
  newer request.
- Transport history can be capped by the engine without trimming public
  conversation state returned by `getMessages()`.
- Stream callbacks still emit every chunk, while escaped plain-text DOM work is
  limited to one render per animation frame and Markdown parsing is deferred
  until completion/cancellation.
- Engine state subscriptions include transient partial-answer and tool-frame
  snapshots by default. Renderers use `{ includeTransient: false }` when their
  event subscription already owns those updates, avoiding redundant public
  state allocation without changing default consumer semantics.
- State and event subscribers are invoked through an isolation boundary. A
  throwing consumer is reported, but cannot abort the request or prevent later
  subscribers from running.
- Changing libraries cancels the active request and starts a fresh
  conversation, preventing cross-library history leakage.
- Core shares a constructable stylesheet across widget instances where
  supported and retains an inline fallback.
- External trigger ARIA attributes are restored when a widget disconnects or
  changes triggers.
- Vue, React, Svelte, and Angular keep package-local registration stacks keyed by
  `widgetId` for their framework-native controller lookup. Duplicate ids resolve
  to the newest registration and reveal the previous registration when it
  unmounts; lookup is not based on DOM proximity.
- Centered modal focus is contained inside the panel, not the launcher or host
  page; outside branches are inert and page scroll state is reference-counted
  and restored.

## Shared Verification Contract

The package source follows the same principle as the `phone-mask` reference:
share behavior, not a lowest-common-denominator renderer.

- `common/tests/unit` defines parameterized contracts for conversation state,
  cancellation, retry, multiline input, focus transfer, copying, localization,
  modal isolation, tools, streaming frames, and trigger restoration.
- `common/tests/e2e` defines one real-browser demo contract for triggers,
  public options, streaming/events, Stop, outside close, centered-dialog focus,
  backdrop behavior, and mobile input sizing.
- Core, Vue, React, Svelte, and Angular provide thin adapters and run the same
  suites. Native package tests cover only framework-specific APIs such as Vue
  `v-model:open`, React `open`/`onOpenChange`, Svelte `bind:open`, Angular
  inputs/outputs, controllers, refs, DI, and packaging. Nuxt fixture tests cover
  module setup, SSR, generated types, defaults, and disabled integrations.

This permits small renderer duplication where a framework gains lifecycle, DOM,
or performance benefits, while keeping the state machine, protocol,
security-sensitive parsing, styles, and observable behavior maintained once.

## HTML Rendering Boundary

Framework renderers create user messages and in-progress assistant text as
native text nodes. Only two kinds of content cross an HTML sink:

- completed assistant answers returned by `renderMarkdown` as
  `Context7RenderedMarkdown`;
- error guidance returned by `buildContext7ErrorHtml` as
  `Context7RenderedErrorHtml`.

The core renderer escapes raw Markdown HTML, restricts links, and owns the small
trusted fragments used for code actions. The error renderer escapes the
transport message and every localized label. Each native renderer passes only
those branded values to its framework HTML sink; the custom element assigns the
same values to DOM HTML. Those sinks are not sanitizers. The shared core
producers are the security boundary, and branded string types make that
provenance explicit to framework packages.

### Maintenance Change Map

| Change                                                                    | Source of truth                                      | Required parity proof                                  |
| ------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Request state, cancellation, retry, history, or events                    | `packages/core/src/engine.ts` and `renderer.ts`      | Core unit tests plus the shared unit contract          |
| Context7 HTTP or stream compatibility                                     | `packages/core/src/transport.ts`                     | Core transport tests; no renderer edits                |
| Markdown, clipboard/copy action, modal, layout, localization, or defaults | The focused core primitive under `packages/core/src` | Primitive unit tests plus the relevant shared behavior |
| Widget visual tokens and responsive UX                                    | `common/styles/_widget.scss`                         | Style tests and the shared browser contract            |
| Native DOM or lifecycle behavior                                          | Core custom element or owning framework component    | The same common contract through each thin adapter     |
| Framework-only API behavior                                               | The owning package                                   | A focused package test and public declaration test     |

When adding another framework package, keep its renderer native, import only
the required `/kit` primitives, implement the common unit and browser adapters,
add a real demo, enforce the same coverage and consumer-bundle budgets, and
document only its framework-specific API. Do not copy the transport, engine,
Markdown parser, defaults, labels, or shared styles into that package.

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
The renderer-independent payloads for question, answer, cancel, tool, and error
events are created by the shared conversation engine before each renderer adds
its native `widget` reference.

## Network And Data Boundary

The only built-in chat request is a browser `POST` to
`https://context7.com/api/v2/widget/chat`. Its JSON body contains the configured
library id and current conversation messages with id, role, content, and text
parts. Presentation options and DOM references are not sent. The core engine
keeps conversation state in memory and does not use cookies or persistent
browser storage.

The hosted `widget.js` request and the Context7 chat request are independent:
DeSource Labs can serve the client asset, but chat content is sent directly to
Context7. Public events deliberately expose conversation data to the host
application; any analytics or persistence added by an integrator is outside
the library's transport boundary.

## Site Hosting

`demo` is a Nuxt static app. Its build runs every public package build, uses the
workspace Nuxt module, copies `packages/core/dist/widget.js` to
`demo/public/widget.js`, then generates `.output/public`. `vercel.json` points
Vercel at that output directory. Demo decoration assets are outside package
bundle budgets.

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
