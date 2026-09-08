import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

interface ChangesetsConfig {
  fixed?: unknown;
}

export interface PublicPackage {
  readonly directory: string;
  readonly name: string;
  readonly packageJsonPath: string;
  readonly version: string;
}

interface PackageJson {
  name?: string;
  private?: boolean;
  version?: string;
}

export async function readCoordinatedPublicPackages(rootDirectory = process.cwd()): Promise<readonly PublicPackage[]> {
  const coordinatedNames = await readCoordinatedPackageNames(rootDirectory);
  const packagesDirectory = path.join(rootDirectory, 'packages');
  const entries = await readdir(packagesDirectory, { withFileTypes: true });
  const packageJsonPaths = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      directory: entry.name,
      packageJsonPath: path.join(packagesDirectory, entry.name, 'package.json')
    }));
  const workspacePackages = await Promise.all(
    packageJsonPaths.map(async ({ directory, packageJsonPath }) => ({
      directory,
      packageJsonPath,
      packageJson: await readPackageJson(packageJsonPath)
    }))
  );
  const publicPackages = workspacePackages.filter(({ packageJson }) => packageJson.private !== true);
  const publicNames = new Set(publicPackages.map(({ packageJson }) => packageJson.name));
  const coordinatedNameSet = new Set(coordinatedNames);
  const missing = coordinatedNames.filter((name) => !publicNames.has(name));
  const unexpected = publicPackages
    .filter(({ packageJson }) => !packageJson.name || !coordinatedNameSet.has(packageJson.name))
    .map(({ packageJson }) => packageJson.name ?? '<unnamed>');

  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(
      `Public package set does not match the coordinated Changesets group. Missing: ${missing.join(', ') || 'none'}. Unexpected: ${unexpected.join(', ') || 'none'}`
    );
  }

  const packagesByName = new Map(publicPackages.map((entry) => [entry.packageJson.name, entry]));

  return coordinatedNames.map((name) => {
    const entry = packagesByName.get(name);
    if (!entry) throw new Error(`Public package ${name} was not found`);
    const version = entry.packageJson.version;
    if (!version) throw new Error(`Public package ${name} does not define a version`);

    return {
      directory: entry.directory,
      name,
      packageJsonPath: entry.packageJsonPath,
      version
    };
  });
}

export async function readCoordinatedPackageNames(rootDirectory = process.cwd()): Promise<readonly string[]> {
  const configPath = path.join(rootDirectory, '.changeset', 'config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8')) as ChangesetsConfig;

  if (!Array.isArray(config.fixed) || config.fixed.length !== 1 || !Array.isArray(config.fixed[0])) {
    throw new Error('Changesets config must contain exactly one fixed public package group');
  }

  const names = config.fixed[0];
  if (names.length === 0 || names.some((name) => typeof name !== 'string' || name.length === 0)) {
    throw new Error('Changesets fixed package group must contain package names');
  }
  if (new Set(names).size !== names.length) {
    throw new Error('Changesets fixed package group contains duplicate package names');
  }

  return names;
}

async function readPackageJson(packageJsonPath: string): Promise<PackageJson> {
  try {
    return JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJson;
  } catch (error) {
    throw new Error(`Unable to read ${packageJsonPath}`, { cause: error });
  }
}
