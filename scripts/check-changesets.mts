import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { readCoordinatedPackageNames } from './public-packages.mts';

const expectedPackages = await readCoordinatedPackageNames();
const changesetsDirectory = path.resolve('.changeset');
const entries = (await readdir(changesetsDirectory))
  .filter((entry) => entry.endsWith('.md') && entry.toLowerCase() !== 'readme.md')
  .sort();

for (const entry of entries) {
  const contents = await readFile(path.join(changesetsDirectory, entry), 'utf8');
  validateChangeset(entry, contents);
}

console.log(`Validated ${entries.length} pending changeset${entries.length === 1 ? '' : 's'}`);

function validateChangeset(filename: string, contents: string): void {
  const frontmatter = /^---\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m.exec(contents);
  if (frontmatter?.index !== 0) {
    throw new Error(`${filename} does not contain valid Changesets frontmatter`);
  }

  const summary = contents.slice(frontmatter[0].length).trim();
  if (!summary) throw new Error(`${filename} does not contain release notes`);

  const declarations = (frontmatter[1] ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const declaration = /^(?:"([^"]+)"|'([^']+)'|([^:'"\s]+)):\s*(patch|minor|major)$/.exec(line);
      if (!declaration) throw new Error(`${filename} contains an unsupported release declaration: ${line}`);
      return { name: declaration[1] ?? declaration[2] ?? declaration[3] ?? '', bump: declaration[4] ?? '' };
    });

  // Empty changesets are valid for explicitly non-publishable work.
  if (declarations.length === 0) return;

  const actualPackages = new Set(declarations.map(({ name }) => name));
  const missing = expectedPackages.filter((name) => !actualPackages.has(name));
  const unexpected = [...actualPackages].filter((name) => !expectedPackages.includes(name));
  const bumps = new Set(declarations.map(({ bump }) => bump));

  if (missing.length > 0 || unexpected.length > 0 || actualPackages.size !== declarations.length) {
    throw new Error(
      `${filename} must select each public package exactly once. Missing: ${missing.join(', ') || 'none'}. Unexpected or duplicated: ${unexpected.join(', ') || (actualPackages.size === declarations.length ? 'none' : 'yes')}`
    );
  }
  if (bumps.size !== 1) throw new Error(`${filename} must use the same version bump for all public packages`);
}
