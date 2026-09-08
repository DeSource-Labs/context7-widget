import { appendFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { readCoordinatedPublicPackages } from './public-packages.mts';

const rootDirectory = process.cwd();
const publicPackages = await readCoordinatedPublicPackages(rootDirectory);
const corePackage = publicPackages.find(({ name }) => name === '@desource/context7-widget');

if (!corePackage) throw new Error('The coordinated release group does not contain the core package');

const version = corePackage.version;

if (!version || !isSemver(version)) {
  throw new Error(`Core package has an invalid version: ${String(version)}`);
}

const mismatchedPackages = publicPackages.filter((packageJson) => packageJson.version !== version);

if (mismatchedPackages.length > 0) {
  const mismatches = mismatchedPackages.map((packageJson) => `${packageJson.name}@${packageJson.version}`).join(', ');

  throw new Error(`All public packages must use the core version ${version}. Mismatched packages: ${mismatches}`);
}

const releaseEntries = await Promise.all(
  publicPackages.map(async (packageJson) => {
    const changelogPath = path.join(rootDirectory, 'packages', packageJson.directory, 'CHANGELOG.md');
    const changelog = await readFile(changelogPath, 'utf8');
    return [packageJson.name, extractChangelogEntry(changelog, version, packageJson.name)] as const;
  })
);
const releaseNotes = releaseEntries.find(([name]) => name === corePackage.name)?.[1];
const releaseNotesPath = process.env.RELEASE_NOTES_PATH;

if (!releaseNotes) throw new Error(`Core changelog entry for ${version} is empty`);

if (!releaseNotesPath) {
  throw new Error('RELEASE_NOTES_PATH must point to the release notes output file');
}

await writeFile(releaseNotesPath, `${releaseNotes}\n`);

if (process.env.GITHUB_OUTPUT) {
  const versionWithoutBuild = version.split('+', 1)[0];

  await appendFile(process.env.GITHUB_OUTPUT, `version=${version}\n`);
  await appendFile(process.env.GITHUB_OUTPUT, `prerelease=${versionWithoutBuild.includes('-')}\n`);
}

console.log(`Prepared GitHub release ${version} for ${publicPackages.length} packages`);

function extractChangelogEntry(changelog: string, targetVersion: string, packageName: string): string {
  const escapedVersion = targetVersion.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const heading = new RegExp(String.raw`^##\s+${escapedVersion}\s*$`, 'm');
  const match = heading.exec(changelog);

  if (!match) {
    throw new Error(`${packageName} changelog does not contain a ${targetVersion} release entry`);
  }

  const entryStart = match.index + match[0].length;
  const remainingChangelog = changelog.slice(entryStart);
  const nextHeading = /^##\s+/m.exec(remainingChangelog);
  const entryEnd = nextHeading?.index ?? remainingChangelog.length;
  const entry = remainingChangelog.slice(0, entryEnd).trim();

  if (!entry) {
    throw new Error(`${packageName} changelog entry for ${targetVersion} is empty`);
  }

  return entry;
}

function isSemver(value: string): boolean {
  const buildSeparator = value.indexOf('+');

  if (buildSeparator !== value.lastIndexOf('+')) {
    return false;
  }

  const versionWithoutBuild = buildSeparator === -1 ? value : value.slice(0, buildSeparator);
  const build = buildSeparator === -1 ? undefined : value.slice(buildSeparator + 1);

  if (build !== undefined && !hasValidIdentifiers(build)) {
    return false;
  }

  const prereleaseSeparator = versionWithoutBuild.indexOf('-');
  const core = prereleaseSeparator === -1 ? versionWithoutBuild : versionWithoutBuild.slice(0, prereleaseSeparator);
  const prerelease = prereleaseSeparator === -1 ? undefined : versionWithoutBuild.slice(prereleaseSeparator + 1);

  return isValidCoreVersion(core) && (prerelease === undefined || isValidPrerelease(prerelease));
}

function isValidCoreVersion(value: string): boolean {
  const identifiers = value.split('.');

  return identifiers.length === 3 && identifiers.every(isValidNumericIdentifier);
}

function isValidPrerelease(value: string): boolean {
  return (
    hasValidIdentifiers(value) &&
    value.split('.').every((identifier) => !/^\d+$/.test(identifier) || isValidNumericIdentifier(identifier))
  );
}

function hasValidIdentifiers(value: string): boolean {
  return value.split('.').every((identifier) => /^[0-9A-Za-z-]+$/.test(identifier));
}

function isValidNumericIdentifier(value: string): boolean {
  return /^(?:0|[1-9]\d*)$/.test(value);
}
