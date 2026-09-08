# Changesets

This directory stores release notes and version bump metadata for publishable packages.

Use:

```bash
pnpm changeset
```

Select every public package in the fixed group, choose the same semver bump for each, and write one user-facing summary.
The fixed release group keeps package versions aligned; selecting every package also places the summary in every
changelog.
Maintainers consume pending changesets with:

```bash
pnpm changeset:version
```

The version command validates this coordinated package selection before consuming pending changesets. Empty changesets
remain available for explicitly non-publishable work.
