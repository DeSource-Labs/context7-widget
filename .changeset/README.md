# Changesets

This directory stores release notes and version bump metadata for publishable packages.

Use:

```bash
pnpm changeset
```

Select every affected publishable package, choose the semver bump, and write a user-facing summary.
Maintainers consume pending changesets with:

```bash
pnpm changeset:version
```
