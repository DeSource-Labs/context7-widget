import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

interface BundleBudget {
  readonly file: string;
  readonly maxGzipBytes: number;
}

const coreChunk = readdirSync(new URL('../packages/core/dist', import.meta.url))
  .filter((file) => /^kit-[\w-]+\.js$/.test(file))
  .sort()[0];

if (!coreChunk) {
  throw new Error('Core shared kit chunk was not found. Run pnpm build before pnpm size:check.');
}

const budgets: readonly BundleBudget[] = [
  { file: 'packages/core/dist/widget.js', maxGzipBytes: 15_500 },
  { file: 'packages/core/dist/index.js', maxGzipBytes: 14_000 },
  { file: `packages/core/dist/${coreChunk}`, maxGzipBytes: 7_500 },
  { file: 'packages/vue/dist/index.js', maxGzipBytes: 8_250 },
  { file: 'packages/vue/dist/styles.css', maxGzipBytes: 5_000 }
];

let failed = false;

for (const budget of budgets) {
  const url = new URL(`../${budget.file}`, import.meta.url);
  if (!existsSync(url)) {
    throw new Error(`${budget.file} was not found. Run pnpm build before pnpm size:check.`);
  }

  const gzipBytes = gzipSync(readFileSync(url), { level: 9 }).byteLength;
  const status = gzipBytes <= budget.maxGzipBytes ? 'PASS' : 'FAIL';
  console.log(
    `${status} ${budget.file}: ${formatKilobytes(gzipBytes)} gzip / ${formatKilobytes(budget.maxGzipBytes)} budget`
  );
  if (gzipBytes > budget.maxGzipBytes) failed = true;
}

if (failed) {
  throw new Error('One or more bundle-size budgets were exceeded.');
}

const kitDeclarations = readFileSync(new URL('../packages/core/dist/kit.d.ts', import.meta.url), 'utf8');
const forbiddenKitTypeMarkers = ['declare global', 'Context7WidgetElement', 'HTMLElementTagNameMap'];
const leakedKitType = forbiddenKitTypeMarkers.find((marker) => kitDeclarations.includes(marker));
console.log(`${leakedKitType ? 'FAIL' : 'PASS'} core /kit declaration boundary`);
if (leakedKitType) {
  throw new Error(`Core /kit declarations unexpectedly retained "${leakedKitType}".`);
}

const treeShakenKit = await build({
  bundle: true,
  format: 'esm',
  minify: true,
  platform: 'browser',
  stdin: {
    contents: "export { resolveContext7AnchorLayout } from './packages/core/dist/kit.js';",
    resolveDir: fileURLToPath(new URL('..', import.meta.url)),
    sourcefile: 'context7-kit-consumer.ts'
  },
  target: 'es2020',
  treeShaking: true,
  write: false
});
const treeShakenOutput = treeShakenKit.outputFiles[0]?.contents;
if (!treeShakenOutput) throw new Error('The kit tree-shaking smoke build did not produce output.');

const treeShakenText = new TextDecoder().decode(treeShakenOutput);
const forbiddenTreeShakeMarkers = ['api/v2/widget/chat', 'data:image', 'Ask me about features'];
const retainedMarker = forbiddenTreeShakeMarkers.find((marker) => treeShakenText.includes(marker));
const treeShakenGzipBytes = gzipSync(treeShakenOutput, { level: 9 }).byteLength;
const treeShakePassed = !retainedMarker && treeShakenGzipBytes <= 400;
console.log(
  `${treeShakePassed ? 'PASS' : 'FAIL'} core /kit layout-only consumer: ${formatKilobytes(treeShakenGzipBytes)} gzip / ${formatKilobytes(400)} budget`
);
if (retainedMarker) {
  console.error(`Tree-shaken kit consumer unexpectedly retained "${retainedMarker}".`);
}
if (!treeShakePassed) {
  throw new Error('The core /kit tree-shaking budget was exceeded.');
}

function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB`;
}
