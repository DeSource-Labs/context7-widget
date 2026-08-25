import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { readCoordinatedPublicPackages } from './public-packages.mts';

interface PackageJson {
  exports?: Record<string, unknown>;
}

const workspaceRoot = process.cwd();
const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const packages = await readCoordinatedPublicPackages(workspaceRoot);

for (const packageInfo of packages) {
  const packageDirectory = path.join('packages', packageInfo.directory);
  const packageJson = JSON.parse(await readFile(packageInfo.packageJsonPath, 'utf8')) as PackageJson;
  const attwArguments = ['exec', 'attw', '--pack', packageDirectory, '--profile', 'esm-only'];

  if (packageJson.exports && Object.hasOwn(packageJson.exports, './styles.css')) {
    attwArguments.push('--exclude-entrypoints', './styles.css');
  }

  run(['exec', 'publint', packageDirectory, '--strict']);
  run(attwArguments);
}

function run(arguments_: readonly string[]): void {
  execFileSync(executable, [...arguments_], {
    cwd: workspaceRoot,
    stdio: 'inherit'
  });
}
