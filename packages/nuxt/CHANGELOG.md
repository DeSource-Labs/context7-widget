# @desource/context7-widget-nuxt

## 0.1.0

### Minor Changes

- Initial release of Context7 Widget, an upgrade to the official Context7 docs widget that brings your site's design into the chat:
  - Adds a hosted `widget.js`, a `context7-widget` custom element, and typed TypeScript helpers. Existing Context7 widget users can replace the script URL and keep their library and allowed-domain settings.
  - Provides native Vue 3, React, Svelte 5, and Angular components with controlled visibility, custom trigger content, and programmatic controls. The Nuxt 3/4 module adds auto-imports, automatic styles, and app-wide defaults, with SSR-safe integration.
  - Matches your site's fonts, colors, spacing, and panel shape through CSS variables and public styling parts. Includes six presets (`default`, `minimal`, `glass`, `neo`, `terminal`, and `brutalist`) and light, dark, or system themes.
  - Opens chat in any corner, in a centered dialog, or beside a trigger. Supports your existing help button, framework-managed triggers, `icon`, `pill`, or `badge` launchers, adjustable panel dimensions, and configurable backdrop and outside-click behavior.
  - Supports multiline questions, streamed answers, Stop and Retry controls, and partial answers that survive cancellation. New output follows the reader only while they stay near the bottom, so scrolling up to read does not pull them back down.
  - Renders safe Markdown with headings, tables, nested lists, tasks, links, and highlighted code blocks. Answers and code have copy actions, and documentation links can use a custom base URL.
  - Makes titles, greetings, placeholders, and launcher text configurable, with localization for interface labels, error text, assistive text, and attribution.
  - Supports keyboard navigation, Escape to close, focus containment and restoration, background isolation for modal dialogs, reduced motion, and mobile safe areas.
  - Exposes typed events for questions, answers, tool calls, errors, and lifecycle changes, alongside controls to open, close, send, cancel, retry, reset, and read conversation history. Supports multiple independent widgets and runtime option updates.
  - Shares conversation, streaming, Markdown, and styles across packages, with tree-shakable imports, a headless API for custom interfaces, and separate framework stylesheets. Streaming updates are batched per animation frame, with Markdown formatting applied when a response finishes.
  - Uses Context7's widget backend for documentation search and AI answers. Chat requests go directly from the browser to Context7; the widget adds no analytics, cookies, or persistent browser storage.
  - Includes live examples, a widget builder that generates integration code, and guides for setup, migration, and styling.

### Patch Changes

- Updated dependencies:
  - @desource/context7-widget@0.1.0
  - @desource/context7-widget-vue@0.1.0
