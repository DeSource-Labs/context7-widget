import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(currentDir, '..');
const rootDir = resolve(siteDir, '../..');
const source = resolve(rootDir, 'packages/core/dist/widget.js');
const target = resolve(siteDir, 'public/widget.js');

try {
  await stat(source);
} catch {
  throw new Error('Missing packages/core/dist/widget.js. Run pnpm --filter @desource/context7-widget build first.');
}

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
