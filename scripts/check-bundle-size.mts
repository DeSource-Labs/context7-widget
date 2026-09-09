import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
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

interface PackageArtifactBudget {
  readonly maxTarballBytes: number;
  readonly name: string;
  readonly root: string;
}

interface SvelteConsumerBudget {
  readonly entry: 'component' | 'controller';
  readonly maxGzipBytes: number;
  readonly name: string;
  readonly ssr?: boolean;
}

interface PackedArtifact {
  readonly filename: string;
  readonly files: readonly { readonly path: string }[];
  readonly name: string;
  readonly version: string;
}

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));
const corePackageRoot = fileURLToPath(new URL('../packages/core', import.meta.url));
const coreKit = fileURLToPath(new URL('../packages/core/dist/kit.js', import.meta.url));
const reactPackageRoot = fileURLToPath(new URL('../packages/react', import.meta.url));
const sveltePackageRoot = fileURLToPath(new URL('../packages/svelte', import.meta.url));

const fileBudgets: readonly FileBudget[] = [
  { file: 'packages/core/dist/widget.js', maxGzipBytes: 22_850 },
  { file: 'packages/vue/dist/index.js', maxGzipBytes: 8_500 },
  { file: 'packages/vue/dist/styles.css', maxGzipBytes: 5_500 },
  { file: 'packages/react/dist/styles.css', maxGzipBytes: 5_500 },
  { file: 'packages/svelte/dist/Context7Widget.svelte', maxGzipBytes: 9_000 },
  { file: 'packages/svelte/dist/styles.css', maxGzipBytes: 5_500 },
  { file: 'packages/nuxt/dist/module.mjs', maxGzipBytes: 950 },
  { file: 'packages/angular/dist/fesm2022/context7-widget-angular.mjs', maxGzipBytes: 13_600 },
  { file: 'packages/angular/dist/styles.css', maxGzipBytes: 5_500 }
];

const packageArtifactBudgets: readonly PackageArtifactBudget[] = [
  { maxTarballBytes: 75_000, name: '@desource/context7-widget', root: 'packages/core' },
  { maxTarballBytes: 24_000, name: '@desource/context7-widget-react', root: 'packages/react' },
  { maxTarballBytes: 25_000, name: '@desource/context7-widget-vue', root: 'packages/vue' },
  { maxTarballBytes: 22_500, name: '@desource/context7-widget-svelte', root: 'packages/svelte' },
  { maxTarballBytes: 6_500, name: '@desource/context7-widget-nuxt', root: 'packages/nuxt' },
  { maxTarballBytes: 28_000, name: '@desource/context7-widget-angular', root: 'packages/angular' }
];

const consumerBudgets: readonly ConsumerBudget[] = [
  {
    contents: "export { resolveContext7AnchorLayout } from '@desource/context7-widget/core';",
    forbiddenMarkers: ['api/v2/widget/chat', 'data:image', 'Context7WidgetElement'],
    maxGzipBytes: 700,
    name: 'core /core layout-only consumer',
    resolveDir: corePackageRoot
  },
  {
    contents: "export { renderMarkdown } from '@desource/context7-widget/core';",
    forbiddenMarkers: ['api/v2/widget/chat', 'data:image', 'Context7WidgetElement'],
    maxGzipBytes: 3_250,
    name: 'core /core Markdown-only consumer',
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
    maxGzipBytes: 23_900,
    name: 'core custom-element runtime consumer',
    resolveDir: corePackageRoot
  },
  {
    alias: {
      '@desource/context7-widget/kit': coreKit
    },
    contents: "export { Context7Widget } from './packages/vue/dist/index.js';",
    external: ['vue'],
    maxGzipBytes: 17_375,
    name: 'Vue component with core /kit consumer',
    resolveDir: workspaceRoot
  },
  {
    alias: {
      '@desource/context7-widget/kit': coreKit
    },
    contents: "export { useContext7Widget } from './packages/vue/dist/index.js';",
    external: ['vue'],
    maxGzipBytes: 18_350,
    name: 'Vue composable with core /kit consumer',
    resolveDir: workspaceRoot
  },
  {
    alias: {
      '@desource/context7-widget/kit': coreKit
    },
    contents: "export { Context7Widget } from '@desource/context7-widget-react/component';",
    external: ['react', 'react-dom', 'react-dom/client'],
    forbiddenMarkers: ['react-dom', 'createRoot', 'flushSync'],
    maxGzipBytes: 16_600,
    name: 'React /component with core /kit consumer',
    resolveDir: reactPackageRoot
  },
  {
    alias: {
      '@desource/context7-widget/kit': coreKit
    },
    contents: "export { Context7Widget } from '@desource/context7-widget-react';",
    external: ['react', 'react-dom', 'react-dom/client'],
    forbiddenMarkers: ['react-dom', 'createRoot', 'flushSync'],
    maxGzipBytes: 16_600,
    name: 'React root component-only consumer',
    resolveDir: reactPackageRoot
  },
  {
    alias: {
      '@desource/context7-widget/kit': coreKit
    },
    contents: "export { useContext7Widget } from '@desource/context7-widget-react/hook';",
    external: ['react', 'react-dom', 'react-dom/client'],
    maxGzipBytes: 17_750,
    name: 'React /hook with core /kit consumer',
    resolveDir: reactPackageRoot
  },
  {
    alias: {
      '@desource/context7-widget/kit': coreKit
    },
    contents: "export { useContext7Widget } from '@desource/context7-widget-react';",
    external: ['react', 'react-dom', 'react-dom/client'],
    maxGzipBytes: 17_750,
    name: 'React root hook-only consumer',
    resolveDir: reactPackageRoot
  },
  {
    alias: {
      '@desource/context7-widget/kit': coreKit
    },
    contents: "export { Context7Widget } from '@desource/context7-widget-angular';",
    external: ['@angular/*', 'tslib'],
    forbiddenMarkers: ['Context7WidgetElement', 'customElements.define'],
    maxGzipBytes: 21_650,
    name: 'Angular component with core /kit consumer',
    resolveDir: fileURLToPath(new URL('../packages/angular', import.meta.url))
  }
];

const svelteConsumerBudgets: readonly SvelteConsumerBudget[] = [
  {
    entry: 'component',
    maxGzipBytes: 19_125,
    name: 'Svelte root component with core /kit consumer'
  },
  {
    entry: 'controller',
    maxGzipBytes: 20_050,
    name: 'Svelte root controller with core /kit consumer'
  },
  {
    entry: 'component',
    maxGzipBytes: 15_200,
    name: 'Svelte root component SSR consumer',
    ssr: true
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

checkFrameworkStyles();

for (const budget of packageArtifactBudgets) {
  checkPackageArtifact(budget);
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

for (const budget of svelteConsumerBudgets) {
  checkSvelteConsumer(budget);
}

for (const [name, url] of [
  ['core root', new URL('../packages/core/dist/index.js', import.meta.url)],
  ['core /core', new URL('../packages/core/dist/core.js', import.meta.url)],
  ['core /kit', new URL('../packages/core/dist/kit.js', import.meta.url)],
  ['Nuxt root', new URL('../packages/nuxt/dist/module.mjs', import.meta.url)],
  ['Vue root', new URL('../packages/vue/dist/index.js', import.meta.url)],
  ['React root', new URL('../packages/react/dist/index.js', import.meta.url)]
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

function checkFrameworkStyles(): void {
  const styleFiles = ['vue', 'react', 'svelte', 'angular'].map((framework) =>
    path.join(workspaceRoot, 'packages', framework, 'dist/styles.css')
  );
  const missingStyle = styleFiles.find((file) => !existsSync(file));

  if (missingStyle) {
    console.error(`FAIL ${path.relative(workspaceRoot, missingStyle)} was not found. Run pnpm build first.`);
    failed = true;
    return;
  }

  const [canonical, ...others] = styleFiles.map((file) => readFileSync(file));
  const passed = canonical !== undefined && others.every((style) => style.equals(canonical));
  console.log(`${passed ? 'PASS' : 'FAIL'} framework stylesheet artifacts are byte-identical`);
  if (!passed) failed = true;
}

function checkSvelteConsumer(budget: SvelteConsumerBudget): void {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'context7-widget-svelte-size-'));
  const outputDirectory = path.join(temporaryDirectory, 'dist');

  try {
    const entryFile = path.join(temporaryDirectory, 'entry.js');
    const exportName = budget.entry === 'component' ? 'Context7Widget' : 'createContext7Widget';
    const packageEntry = path.join(sveltePackageRoot, 'dist/index.js');
    writeFileSync(entryFile, `export { ${exportName} } from ${JSON.stringify(packageEntry)};\n`);
    const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    execFileSync(
      executable,
      ['--dir', sveltePackageRoot, 'exec', 'vite', 'build', '--config', 'vite.size.config.ts', '--logLevel', 'error'],
      {
        cwd: workspaceRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CONTEXT7_SVELTE_SIZE_ENTRY_FILE: entryFile,
          CONTEXT7_SVELTE_SIZE_OUT_DIR: outputDirectory,
          CONTEXT7_SVELTE_SIZE_SSR: String(budget.ssr === true)
        }
      }
    );

    const outputFiles = collectJavaScriptFiles(outputDirectory);
    if (outputFiles.length === 0) throw new Error('Vite did not produce JavaScript output');
    const gzipBytes = outputFiles.reduce(
      (total, file) => total + gzipSync(readFileSync(file), { level: 9 }).byteLength,
      0
    );
    reportBudget(budget.name, gzipBytes, budget.maxGzipBytes);
  } catch (error) {
    console.error(`FAIL ${budget.name} could not be bundled.`, error);
    failed = true;
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

function collectJavaScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(entryPath);
    return /\.(?:m?js)$/u.test(entry.name) ? [entryPath] : [];
  });
}

function checkPackageArtifact(budget: PackageArtifactBudget): void {
  const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'context7-widget-pack-'));

  try {
    const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    const output = execFileSync(
      executable,
      ['--filter', budget.name, 'pack', '--pack-destination', temporaryDirectory, '--json'],
      { cwd: workspaceRoot, encoding: 'utf8' }
    );
    const artifact = JSON.parse(output) as PackedArtifact;
    const packageRoot = path.join(workspaceRoot, budget.root);
    const packageJson = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as {
      exports?: unknown;
      jsdelivr?: string;
      main?: string;
      module?: string;
      types?: string;
      unpkg?: string;
    };
    const packedPaths = new Set(artifact.files.map((file) => normalizePackedPath(file.path)));
    const forbiddenPath = [...packedPaths].find(
      (file) =>
        file.endsWith('.map') ||
        (!file.startsWith('dist/') &&
          !['CHANGELOG.md', 'LICENSE', 'NOTICE', 'README.md', 'package.json'].includes(file))
    );
    const missingTarget = collectPackageTargets(packageJson).find((target) => !packedPaths.has(target));
    const tarballBytes = statSync(artifact.filename).size;
    const passed =
      artifact.name === budget.name && !forbiddenPath && !missingTarget && tarballBytes <= budget.maxTarballBytes;

    console.log(
      `${passed ? 'PASS' : 'FAIL'} ${budget.name} npm artifact: ${formatKilobytes(tarballBytes)} / ${formatKilobytes(budget.maxTarballBytes)} budget`
    );
    if (artifact.name !== budget.name) {
      console.error(`Packed ${artifact.name} while checking ${budget.name}.`);
    }
    if (forbiddenPath) {
      console.error(`${budget.name} unexpectedly packed "${forbiddenPath}".`);
    }
    if (missingTarget) {
      console.error(`${budget.name} did not pack declared target "${missingTarget}".`);
    }
    if (!passed) failed = true;
  } catch (error) {
    console.error(`FAIL ${budget.name} npm artifact could not be validated.`, error);
    failed = true;
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

function collectPackageTargets(packageJson: {
  exports?: unknown;
  jsdelivr?: string;
  main?: string;
  module?: string;
  types?: string;
  unpkg?: string;
}): string[] {
  const targets = new Set<string>();

  for (const target of [
    packageJson.main,
    packageJson.module,
    packageJson.types,
    packageJson.unpkg,
    packageJson.jsdelivr
  ]) {
    addPackageTarget(targets, target);
  }
  visitExportTargets(packageJson.exports, targets);
  return [...targets];
}

function visitExportTargets(value: unknown, targets: Set<string>): void {
  if (typeof value === 'string') {
    addPackageTarget(targets, value);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const child of Object.values(value)) visitExportTargets(child, targets);
}

function addPackageTarget(targets: Set<string>, value: string | undefined): void {
  if (!value?.startsWith('./') || value.includes('*')) return;
  targets.add(normalizePackedPath(value.slice(2)));
}

function normalizePackedPath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB`;
}
