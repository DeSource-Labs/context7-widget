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
styling contract, typed helpers, native Vue and React bindings, Nuxt demo site,
events, and compatibility monitoring.

## Workspace Deliverables

- `packages/core/dist/widget.js`: zero-build browser loader for script-tag replacement.
- `packages/core/dist/index.js` plus preserved internal ESM modules: tree-shakeable
  core TypeScript build for custom integrations.
- `packages/core/dist/core.js`: framework-neutral public primitives for custom
  chat experiences.
- `packages/core/dist/kit.js`: the broader internal contract used to implement
  framework packages.
- `context7-widget` custom element: the framework-agnostic core runtime surface.
- `packages/vue`: Vue 3 component, composable, plugin helper, and SCSS output.
- `packages/react`: native React component, controlled API, programmatic hook,
  and SCSS output.
- planned framework packages: Svelte and Angular implementations built on the
  same boundary and shared contracts.
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

`@desource/context7-widget-vue` and
`@desource/context7-widget-react` depend on the kit instead of the core custom
element. Each owns:

- native framework DOM rendering and display state;
- framework lifecycle, focus, trigger, and positioning behavior;
- idiomatic controlled state plus typed props/events and exposed controls;
- a composable or hook that mounts and controls its native component;
- SCSS-built widget styles.

Vue additionally owns typed slots and its plugin helper. Future Svelte and
Angular packages should follow the same boundary: own their framework UI and
lifecycle, share backend/protocol code through `/kit`, and never wrap the core
custom element.

All implementations always show compact linked attribution for Context7 and
DeSource Labs. Attribution is part of the product contract rather than a
configurable display option.

Core, Vue, and React compile their widget selectors from
`common/styles/_widget.scss`. Core scopes the mixin to `:host`; framework
packages scope it to `.context7-widget`. Vue and React also compile their native
managed button from `common/styles/_framework-trigger.scss`. This keeps the
visual contract in one source of truth without making a framework package
depend on the custom-element runtime. Core normalizes Sass's nested
host-attribute output to selectors such as `:host([open])`, which are exercised
in Chromium against real Shadow DOM.

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
- A cancelled request cannot append late frames or clear the busy state of a
  newer request.
- Transport history can be capped by the engine without trimming public
  conversation state returned by `getMessages()`.
- Stream callbacks still emit every chunk, while escaped plain-text DOM work is
  limited to one render per animation frame and Markdown is parsed once at
  completion/cancellation.
- Changing libraries cancels the active request and starts a fresh
  conversation, preventing cross-library history leakage.
- Core shares a constructable stylesheet across widget instances where
  supported and retains an inline fallback.
- External trigger ARIA attributes are restored when a widget disconnects or
  changes triggers.
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
- Core, Vue, and React provide thin adapters and run the same suites. Native
  package tests cover only framework-specific APIs such as Vue `v-model:open`
  or React `open`/`onOpenChange`, hooks/composables, refs, and packaging.

This permits small renderer duplication where Vue or React gains lifecycle,
DOM, or performance benefits, while keeping the state machine, protocol,
security-sensitive parsing, and observable behavior maintained once.

### Maintenance Change Map

| Change                                                                    | Source of truth                                      | Required parity proof                                  |
| ------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Request state, cancellation, retry, history, or events                    | `packages/core/src/engine.ts` and `renderer.ts`      | Core unit tests plus the shared unit contract          |
| Context7 HTTP or stream compatibility                                     | `packages/core/src/transport.ts`                     | Core transport tests; no renderer edits                |
| Markdown, clipboard/copy action, modal, layout, localization, or defaults | The focused core primitive under `packages/core/src` | Primitive unit tests plus the relevant shared behavior |
| Widget visual tokens and responsive UX                                    | `common/styles/_widget.scss`                         | Style tests and the shared browser contract            |
| Native DOM or lifecycle behavior                                          | Core custom element, Vue SFC, and React component    | The same common contract through each thin adapter     |
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
