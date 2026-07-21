# Contributing to Context7 Widget

Thanks for considering a contribution. This project is a monorepo for a Context7-compatible browser widget, a core
TypeScript package, Vue bindings, and the Nuxt documentation site.

## Code of Conduct

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Development Setup

Requirements:

- Node.js >= 25
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
```

Playwright e2e tests start a local Vite demo for framework packages. If browsers are not installed locally, run:

```bash
pnpm exec playwright install chromium
```

## Coding Standards

- Use TypeScript for public package code.
- Keep framework packages thin; shared behavior belongs in `packages/core` or `@desource/context7-widget/kit`.
- Prefer stable public APIs: options, events, CSS variables, and `::part(...)`.
- Do not make internal shadow DOM class names public API.
- Add tests for bug fixes and public behavior changes.

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
- Run `pnpm test:all`
- Update docs for public API changes
- Add a changeset for publishable package changes

Create a changeset with:

```bash
pnpm changeset
```

Do not add changesets for site-only or internal-only documentation changes unless they should appear in npm changelogs.

## Release Process

Maintainers publish through Changesets. See [RELEASE.md](./RELEASE.md).

## Security

Please do not open public issues for vulnerabilities. See [SECURITY.md](./SECURITY.md).
