import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const packageRoot = process.cwd();
const bundlePath = path.join(packageRoot, 'dist/fesm2022/context7-widget-angular.mjs');
const bundle = await readFile(bundlePath, 'utf8');

await writeFile(bundlePath, bundle.replace(/\n\/\/# sourceMappingURL=.*\n?$/u, '\n'));
await Promise.all(
  ['LICENSE', 'README.md', 'package.json', 'fesm2022/context7-widget-angular.mjs.map'].map((file) =>
    rm(path.join(packageRoot, 'dist', file), { force: true })
  )
);
