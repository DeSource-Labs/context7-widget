# Contributing to Context7 Widget

Thanks for considering a contribution. This project is a monorepo for a Context7-compatible browser widget, a core
TypeScript package, native Vue, React, Svelte, and Angular bindings, a Nuxt module, and the Nuxt documentation site.

## Code of Conduct

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Development Setup

Requirements:

- Node.js >= 22.22.3 (Node.js 26 is used in GitHub Actions)
- pnpm 12.3.4

```bash
pnpm install
pnpm build
pnpm dev:prepare
pnpm dev:demo
```

## Project Structure

```text
context7-widget/
├── packages/
│   ├── angular/     # @desource/context7-widget-angular
│   ├── core/        # @desource/context7-widget
│   ├── nuxt/        # @desource/context7-widget-nuxt
│   ├── react/       # @desource/context7-widget-react
│   ├── svelte/      # @desource/context7-widget-svelte
│   └── vue/         # @desource/context7-widget-vue
├── common/
│   └── tests/       # shared unit/e2e test helpers
├── demo/            # Nuxt documentation, examples, and visual lab
├── docs/            # architecture and integration notes
└── scripts/         # maintenance scripts
```

## Useful Commands

```bash
pnpm format
pnpm lint
pnpm lint:fix
pnpm test:unit
pnpm test:e2e
pnpm test:unit:coverage
pnpm build
pnpm build:all
pnpm size:check
pnpm validate:packages
pnpm check:release
```

Playwright e2e tests start local Vite demos for the core custom element and
framework packages. If browsers are not installed locally, run:

```bash
pnpm exec playwright install chromium firefox webkit
```

## Coding Standards

- Use TypeScript for public package code.
- Keep framework rendering and lifecycle native to that framework.
- Put rendering-independent contracts, transport, markdown, defaults, and
  reusable helpers in `@desource/context7-widget/kit`.
- Do not implement a framework package by mounting or wrapping the core custom
  element.
- Prefer stable public APIs: options, events, CSS variables, and `::part(...)`.
- Do not make internal shadow DOM class names public API.
- Add tests for bug fixes and public behavior changes.
- Put reusable unit adapters and cross-framework end-to-end behavior in
  `common/tests`.

## Commits

Use Conventional Commits where practical:

```text
feat(core): add preset option
fix(vue): normalize custom trigger ids
docs(readme): add CSP example
test(core): cover loader compatibility
chore(ci): add release workflow
```

Recommended scopes:

- `core`
- `angular`
- `nuxt`
- `react`
- `svelte`
- `vue`
- `site`
- `docs`
- `ci`
- `release`

## Pull Requests

Before opening a PR:

- Run `pnpm format:check`
- Run `pnpm lint`
- Run `pnpm build:all`
- Run `pnpm size:check`
- Run `pnpm validate:packages`
- Run `pnpm test:all`
- Update docs for public API changes
- Add a changeset for publishable package changes. Select every public package so the user-facing summary is copied to
  every package changelog; the fixed Changesets group keeps all package versions synchronized.

The general CI workflow is intentionally manual-dispatch only. Run the checks
above locally before requesting review; a maintainer can dispatch the same
release-quality gate for the branch when needed.

Create a changeset with:

```bash
pnpm changeset
```

Do not add changesets for site-only or internal-only documentation changes unless they should appear in npm
changelogs.

## Dependency Policy

- Prefer the latest stable release that satisfies every direct peer and toolchain constraint.
- Keep TypeScript 5.9 at the workspace/Nuxt layer and TypeScript 6.0 inside the Angular package while the current Nuxt
  module builder and Angular compiler require non-overlapping TypeScript peer ranges.
- Run `pnpm update -r --latest`, `pnpm check:peers`, and `pnpm audit:prod` after changing manifests.
- Keep a dependency below `latest` only when a named consumer cannot support the newer release. Document that reason
  next to the constraint or in the change that introduces it.
- Do not add `minimumReleaseAgeExclude` entries without a documented security or compatibility reason.
- Treat install scripts as denied by default. Add an `allowBuilds` entry only when a verified build or runtime path
  needs it.

## Release Process

Maintainers publish the fixed package group through a reviewed release pull request. The release workflow runs the full
quality gate, publishes without package-specific Git tags, and creates one shared version tag and GitHub release. See
[RELEASE.md](./RELEASE.md).

## Security

Please do not open public issues for vulnerabilities. See [SECURITY.md](./SECURITY.md).
