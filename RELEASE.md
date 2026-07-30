# Release Process

This monorepo uses [Changesets](https://github.com/changesets/changesets) for package versioning and npm publishing.

## Packages

- `@desource/context7-widget`
- `@desource/context7-widget-vue`

Planned framework packages, including Nuxt, React, Svelte, and Angular bindings, should be added to this list only when
they become publishable packages in the monorepo.

## Contributor Flow

For public package changes:

```bash
pnpm changeset
```

Select the affected package(s), choose the semver bump, and write a user-facing summary.

## Maintainer Flow

From `main`:

```bash
pnpm install
pnpm run check:release
pnpm changeset:version
git add .
git commit -m "chore: Release packages"
git push origin main
```

The release workflow publishes when:

- the commit message contains `chore: Release packages`, or
- the workflow is started manually with `workflow_dispatch`.

## Manual Publish

If needed, publish from a clean `main` checkout:

```bash
pnpm install --frozen-lockfile
pnpm run check:release
pnpm changeset:publish
git push --follow-tags
```

## npm Token

GitHub Actions requires an `NPM_TOKEN` repository secret with permission to publish packages under the `@desource`
scope.

## Pre-releases

```bash
pnpm changeset pre enter beta
pnpm changeset
pnpm changeset:version
pnpm changeset:publish
pnpm changeset pre exit
```

## Release Checklist

- `pnpm format:check`
- `pnpm lint`
- `pnpm build:all`
- `pnpm test:all`
- `pnpm test:unit:coverage`
- `pnpm size:check`
- `pnpm validate:packages`
- Package tarball smoke check with `pnpm --filter <package> pack --pack-destination /tmp`
- Confirm `NPM_TOKEN` exists in GitHub repository secrets
