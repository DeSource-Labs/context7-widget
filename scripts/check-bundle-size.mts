import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build, type BuildOptions } from 'esbuild';

interface FileBudget {
  readonly file: string;
  readonly maxGzipBytes: number;
}

interface ConsumerBudget {
  readonly alias?: Readonly<Record<string, string>>;
  readonly contents: string;
  readonly external?: readonly string[];
  readonly forbiddenMarkers?: readonly string[];
  readonly maxGzipBytes: number;
  readonly name: string;
  readonly resolveDir: string;
}

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const corePackageRoot = fileURLToPath(new URL('../packages/core', import.meta.url));
const coreKit = fileURLToPath(new URL('../packages/core/dist/kit.js', import.meta.url));

const fileBudgets: readonly FileBudget[] = [
  { file: 'packages/core/dist/widget.js', maxGzipBytes: 15_800 },
  { file: 'packages/vue/dist/index.js', maxGzipBytes: 8_500 },
  { file: 'packages/vue/dist/styles.css', maxGzipBytes: 5_200 }
];

const consumerBudgets: readonly ConsumerBudget[] = [
  {
    contents: "export { resolveContext7AnchorLayout } from '@desource/context7-widget';",
    forbiddenMarkers: ['api/v2/widget/chat', 'data:image', 'Context7WidgetElement'],
    maxGzipBytes: 400,
    name: 'core root layout-only consumer',
    resolveDir: corePackageRoot
  },
  {
    contents: "export { renderMarkdown } from '@desource/context7-widget';",
    forbiddenMarkers: ['api/v2/widget/chat', 'data:image', 'Context7WidgetElement'],
    maxGzipBytes: 900,
    name: 'core root Markdown-only consumer',
    resolveDir: corePackageRoot
  },
  {
    contents: "export { streamContext7Response } from '@desource/context7-widget/kit';",
    forbiddenMarkers: ['data:image', 'Context7WidgetElement'],
    maxGzipBytes: 1_200,
    name: 'core /kit transport-only consumer',
    resolveDir: corePackageRoot
  },
  {
    contents: "export { mountContext7Widget } from '@desource/context7-widget';",
    maxGzipBytes: 16_000,
    name: 'core custom-element runtime consumer',
    resolveDir: corePackageRoot
  },
  {
    alias: {
      '@desource/context7-widget/kit': coreKit
    },
    contents: "export { Context7Widget } from './packages/vue/dist/index.js';",
    external: ['vue'],
    maxGzipBytes: 11_000,
    name: 'Vue component with core /kit consumer',
    resolveDir: workspaceRoot
  }
];

let failed = false;

for (const budget of fileBudgets) {
  const url = new URL(`../${budget.file}`, import.meta.url);
  if (!existsSync(url)) {
    console.error(`FAIL ${budget.file} was not found. Run pnpm build before pnpm size:check.`);
    failed = true;
    continue;
  }

  const gzipBytes = gzipSync(readFileSync(url), { level: 9 }).byteLength;
  reportBudget(budget.file, gzipBytes, budget.maxGzipBytes);
}

const kitDeclarationsUrl = new URL('../packages/core/dist/kit.d.ts', import.meta.url);
if (!existsSync(kitDeclarationsUrl)) {
  console.error('FAIL packages/core/dist/kit.d.ts was not found. Run pnpm build before pnpm size:check.');
  failed = true;
} else {
  const kitDeclarations = readFileSync(kitDeclarationsUrl, 'utf8');
  const forbiddenKitTypeMarkers = ['declare global', 'Context7WidgetElement', 'HTMLElementTagNameMap'];
  const leakedKitType = forbiddenKitTypeMarkers.find((marker) => kitDeclarations.includes(marker));
  console.log(`${leakedKitType ? 'FAIL' : 'PASS'} core /kit declaration boundary`);
  if (leakedKitType) {
    console.error(`Core /kit declarations unexpectedly retained "${leakedKitType}".`);
    failed = true;
  }
}

for (const budget of consumerBudgets) {
  try {
    const output = await buildConsumer(budget);
    const outputText = new TextDecoder().decode(output);
    const retainedMarker = budget.forbiddenMarkers?.find((marker) => outputText.includes(marker));
    const gzipBytes = gzipSync(output, { level: 9 }).byteLength;
    const passed = !retainedMarker && gzipBytes <= budget.maxGzipBytes;

    console.log(
      `${passed ? 'PASS' : 'FAIL'} ${budget.name}: ${formatKilobytes(gzipBytes)} gzip / ${formatKilobytes(budget.maxGzipBytes)} budget`
    );
    if (retainedMarker) {
      console.error(`${budget.name} unexpectedly retained "${retainedMarker}".`);
    }
    if (!passed) failed = true;
  } catch (error) {
    console.error(`FAIL ${budget.name} could not be bundled.`, error);
    failed = true;
  }
}

for (const [name, url] of [
  ['core root', new URL('../packages/core/dist/index.js', import.meta.url)],
  ['core /kit', new URL('../packages/core/dist/kit.js', import.meta.url)],
  ['Vue root', new URL('../packages/vue/dist/index.js', import.meta.url)]
] as const) {
  try {
    await import(url.href);
    console.log(`PASS ${name} SSR import`);
  } catch (error) {
    console.error(`FAIL ${name} SSR import`, error);
    failed = true;
  }
}

if (failed) {
  throw new Error('One or more bundle, tree-shaking, declaration, or SSR checks failed.');
}

async function buildConsumer(budget: ConsumerBudget): Promise<Uint8Array> {
  const options: BuildOptions = {
    alias: budget.alias,
    bundle: true,
    external: budget.external ? [...budget.external] : undefined,
    format: 'esm',
    logLevel: 'silent',
    minify: true,
    platform: 'browser',
    stdin: {
      contents: budget.contents,
      resolveDir: budget.resolveDir,
      sourcefile: `${budget.name.replace(/\W+/g, '-')}.ts`
    },
    target: 'es2020',
    treeShaking: true,
    tsconfigRaw: { compilerOptions: {} },
    write: false
  };
  const result = await build(options);
  const output = result.outputFiles?.[0]?.contents;
  if (!output) throw new Error('esbuild did not produce an output file.');
  return output;
}

function reportBudget(name: string, gzipBytes: number, maxGzipBytes: number): void {
  const passed = gzipBytes <= maxGzipBytes;
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${name}: ${formatKilobytes(gzipBytes)} gzip / ${formatKilobytes(maxGzipBytes)} budget`
  );
  if (!passed) failed = true;
}

function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB`;
}
