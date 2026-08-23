# Contributing to Context7 Widget

Thanks for considering a contribution. This project is a monorepo for a Context7-compatible browser widget, a core
TypeScript package, native Vue and React bindings, and the Nuxt documentation site.

## Code of Conduct

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Development Setup

Requirements:

- Node.js >= 22.18.0 (Node.js 24 is used in GitHub Actions)
- pnpm 11.10.0

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
│   ├── core/        # @desource/context7-widget
│   ├── react/       # @desource/context7-widget-react
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
- `react`
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
- Add a changeset for publishable package changes. Select core, React, and Vue together so the user-facing summary is
  copied to every package changelog; their fixed Changesets group keeps the versions synchronized.

The general CI workflow is intentionally manual-dispatch only. Run the checks
above locally before requesting review; a maintainer can dispatch the same
release-quality gate for the branch when needed.

Create a changeset with:

```bash
pnpm changeset
```

Do not add changesets for site-only or internal-only documentation changes unless they should appear in npm
changelogs.

## Release Process

Maintainers publish the fixed package group through a reviewed release pull request. The release workflow runs the full
quality gate, publishes without package-specific Git tags, and creates one shared version tag and GitHub release. See
[RELEASE.md](./RELEASE.md).

## Security

Please do not open public issues for vulnerabilities. See [SECURITY.md](./SECURITY.md).
