import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

type MatrixEntry = Readonly<{
  expectedMajor: number;
  label: string;
  range: string;
}>;

type PackageManifest = Readonly<{
  name: string;
  packageManager: string;
  version: string;
}>;

const PACKAGE_MATRIX: readonly MatrixEntry[] = [
  { expectedMajor: 3, label: 'Nuxt 3', range: '^3.17.0' },
  { expectedMajor: 4, label: 'Nuxt 4', range: '^4.0.0' }
];

const PACKAGE_NAMES = {
  core: '@desource/context7-widget',
  nuxt: '@desource/context7-widget-nuxt',
  vue: '@desource/context7-widget-vue'
} as const;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../../../..');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'context7-widget-nuxt-release-'));
const tarballDirectory = join(temporaryRoot, 'tarballs');

try {
  await ensureBuiltArtifacts();
  await mkdir(tarballDirectory, { recursive: true });

  const rootManifest = await readJson<PackageManifest>(join(repositoryRoot, 'package.json'));
  const tarballs = {
    core: await packPackage(PACKAGE_NAMES.core),
    nuxt: await packPackage(PACKAGE_NAMES.nuxt),
    vue: await packPackage(PACKAGE_NAMES.vue)
  };

  for (const matrixEntry of PACKAGE_MATRIX) {
    await verifyConsumer(matrixEntry, tarballs, rootManifest.packageManager);
  }

  console.info(`Packed Nuxt consumer proof passed for ${PACKAGE_MATRIX.map(({ label }) => label).join(' and ')}.`);
} finally {
  if (process.env.CONTEXT7_KEEP_PACKED_FIXTURES === '1') {
    console.info(`Packed consumer fixtures kept at ${temporaryRoot}`);
  } else {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
}

async function ensureBuiltArtifacts(): Promise<void> {
  const packageArtifacts = new Map<string, readonly string[]>([
    [PACKAGE_NAMES.core, ['packages/core/dist/kit.js', 'packages/core/dist/kit.d.ts']],
    [PACKAGE_NAMES.vue, ['packages/vue/dist/index.js', 'packages/vue/dist/index.d.ts', 'packages/vue/dist/styles.css']],
    [
      PACKAGE_NAMES.nuxt,
      [
        'packages/nuxt/dist/module.mjs',
        'packages/nuxt/dist/types.d.mts',
        'packages/nuxt/dist/runtime/component.js',
        'packages/nuxt/dist/runtime/component.d.ts',
        'packages/nuxt/dist/runtime/composable.js',
        'packages/nuxt/dist/runtime/composable.d.ts',
        'packages/nuxt/dist/runtime/plugin.js'
      ]
    ]
  ]);

  for (const [packageName, artifacts] of packageArtifacts) {
    if ((await findMissingArtifacts(artifacts)).length === 0) continue;

    await run('pnpm', ['--filter', packageName, 'build'], {
      cwd: repositoryRoot,
      label: `build ${packageName}`,
      timeoutMs: 360_000
    });

    const missing = await findMissingArtifacts(artifacts);
    if (missing.length > 0) {
      throw new Error(`${packageName} build did not create required publish artifacts: ${missing.join(', ')}`);
    }
  }
}

async function findMissingArtifacts(artifacts: readonly string[]): Promise<string[]> {
  const missing: string[] = [];

  for (const artifact of artifacts) {
    try {
      await access(join(repositoryRoot, artifact));
    } catch {
      missing.push(artifact);
    }
  }

  return missing;
}

async function packPackage(packageName: string): Promise<string> {
  const before = new Set(await readdir(tarballDirectory));

  await run('pnpm', ['--filter', packageName, 'pack', '--pack-destination', tarballDirectory, '--json'], {
    cwd: repositoryRoot,
    label: `pack ${packageName}`
  });

  const created = (await readdir(tarballDirectory)).filter((file) => file.endsWith('.tgz') && !before.has(file));
  if (created.length !== 1 || !created[0]) {
    throw new Error(`Expected one tarball for ${packageName}; created ${created.length}.`);
  }

  return join(tarballDirectory, created[0]);
}

async function verifyConsumer(
  matrixEntry: MatrixEntry,
  tarballs: Readonly<{ core: string; nuxt: string; vue: string }>,
  packageManager: string
): Promise<void> {
  const consumerRoot = join(temporaryRoot, `nuxt-${matrixEntry.expectedMajor}`);
  const appRoot = join(consumerRoot, 'app');
  await mkdir(appRoot, { recursive: true });

  await writeJson(join(consumerRoot, 'package.json'), {
    name: `context7-widget-packed-nuxt-${matrixEntry.expectedMajor}`,
    private: true,
    type: 'module',
    packageManager,
    dependencies: {
      [PACKAGE_NAMES.nuxt]: fileDependency(tarballs.nuxt),
      nuxt: matrixEntry.range,
      vue: '^3.5.0'
    }
  });
  await writeFile(
    join(consumerRoot, 'pnpm-workspace.yaml'),
    `allowBuilds:
  '@parcel/watcher': true
  esbuild: true

overrides:
  '${PACKAGE_NAMES.core}': ${JSON.stringify(fileDependency(tarballs.core))}
  '${PACKAGE_NAMES.vue}': ${JSON.stringify(fileDependency(tarballs.vue))}
`
  );
  await writeFile(
    join(consumerRoot, '.npmrc'),
    ['auto-install-peers=false', 'hoist=false', 'node-linker=isolated', 'strict-peer-dependencies=true', ''].join('\n')
  );
  await writeFile(
    join(consumerRoot, 'nuxt.config.ts'),
    `import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  modules: ['${PACKAGE_NAMES.nuxt}'],
  srcDir: 'app',
  context7Widget: {
    defaults: {
      library: '/vercel/nuxt',
      position: 'anchor',
      widgetId: 'packed-nuxt-${matrixEntry.expectedMajor}'
    }
  }
});
`
  );
  await writeFile(
    join(appRoot, 'app.vue'),
    `<script setup lang="ts">
const widget = useContext7Widget();
const composableReady = typeof widget.open === 'function' && typeof widget.send === 'function';
const hydrated = ref(false);

onMounted(() => {
  hydrated.value = true;
});
</script>

<template>
  <main>
    <div id="contract-sentinel">context7-widget-packed:${matrixEntry.expectedMajor}</div>
    <div id="composable-status">{{ composableReady ? 'composable:yes' : 'composable:no' }}</div>
    <div id="hydration-status">{{ hydrated ? 'hydration:ready' : 'hydration:pending' }}</div>
    <Context7Widget />
  </main>
</template>
`
  );

  await run('pnpm', ['install', '--no-frozen-lockfile', '--prefer-offline'], {
    cwd: consumerRoot,
    label: `${matrixEntry.label} install`,
    timeoutMs: 360_000
  });

  const installedNuxt = await readJson<PackageManifest>(join(consumerRoot, 'node_modules/nuxt/package.json'));
  const installedMajor = Number.parseInt(installedNuxt.version.split('.')[0] ?? '', 10);
  if (installedMajor !== matrixEntry.expectedMajor) {
    throw new Error(`${matrixEntry.label} range ${matrixEntry.range} resolved to ${installedNuxt.version}.`);
  }

  await assertTransitivePackagesAreNotHostImports(consumerRoot);
  await run('pnpm', ['exec', 'nuxt', 'prepare'], {
    cwd: consumerRoot,
    label: `${matrixEntry.label} prepare`,
    timeoutMs: 240_000
  });
  await assertGeneratedImportBoundary(consumerRoot);
  await run('pnpm', ['exec', 'nuxt', 'build'], {
    cwd: consumerRoot,
    label: `${matrixEntry.label} build`,
    timeoutMs: 360_000
  });
  await assertProductionSsr(consumerRoot, matrixEntry.expectedMajor);

  console.info(
    `${matrixEntry.label} ${installedNuxt.version}: isolated install, generated imports, production build, SSR, and browser hydration passed.`
  );
}

async function assertTransitivePackagesAreNotHostImports(consumerRoot: string): Promise<void> {
  const script = `
for (const specifier of ${JSON.stringify([PACKAGE_NAMES.core, PACKAGE_NAMES.vue])}) {
  let resolved = false;
  try {
    import.meta.resolve(specifier);
    resolved = true;
  } catch (error) {
    if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  }
  if (resolved) throw new Error(specifier + ' leaked into the consumer root');
}
`;

  await run(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: consumerRoot,
    label: 'strict host import boundary'
  });
}

async function assertGeneratedImportBoundary(consumerRoot: string): Promise<void> {
  const components = await readFile(join(consumerRoot, '.nuxt/components.d.ts'), 'utf8');
  const imports = await readFile(join(consumerRoot, '.nuxt/imports.d.ts'), 'utf8');

  assertContains(components, 'Context7Widget', 'generated component types');
  assertContains(components, 'context7-widget-nuxt/dist/runtime/component', 'generated component proxy');
  assertContains(imports, 'useContext7Widget', 'generated composable types');
  assertContains(imports, 'context7-widget-nuxt/dist/runtime/composable', 'generated composable proxy');

  const forbiddenHostSpecifiers = [PACKAGE_NAMES.core, `${PACKAGE_NAMES.core}/kit`, PACKAGE_NAMES.vue];
  for (const generatedFile of [components, imports]) {
    if (forbiddenHostSpecifiers.some((specifier) => containsQuotedSpecifier(generatedFile, specifier))) {
      throw new Error('Generated host declarations bypass the Nuxt package runtime proxies.');
    }
  }
}

async function assertProductionSsr(consumerRoot: string, expectedMajor: number): Promise<void> {
  const serverEntry = join(consumerRoot, '.output/server/index.mjs');
  await access(serverEntry);
  const port = await reservePort();
  const serverOutput: string[] = [];
  const child = spawn(process.execPath, [serverEntry], {
    cwd: consumerRoot,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      NITRO_HOST: '127.0.0.1',
      NITRO_PORT: String(port),
      PORT: String(port)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout?.on('data', (chunk: Buffer) => serverOutput.push(chunk.toString()));
  child.stderr?.on('data', (chunk: Buffer) => serverOutput.push(chunk.toString()));

  try {
    const serverUrl = `http://127.0.0.1:${port}/`;
    const html = await fetchWhenReady(serverUrl, child, serverOutput);
    assertContains(html, `context7-widget-packed:${expectedMajor}`, 'production SSR sentinel');
    assertContains(html, 'composable:yes', 'production composable result');
    assertContains(html, 'hydration:pending', 'production pre-hydration state');
    assertContains(html, 'class="context7-widget"', 'production component markup');
    assertContains(html, `widget-id="packed-nuxt-${expectedMajor}"`, 'production module defaults');
    await assertBrowserHydration(serverUrl);
  } finally {
    child.kill('SIGTERM');
    await new Promise<void>((resolveClose) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        resolveClose();
        return;
      }
      child.once('close', () => resolveClose());
      setTimeout(() => {
        child.kill('SIGKILL');
        resolveClose();
      }, 5_000).unref();
    });
  }
}

async function assertBrowserHydration(serverUrl: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const browserErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  try {
    await page.goto(serverUrl, { waitUntil: 'domcontentloaded' });

    const hydrationStatus = page.locator('#hydration-status');
    const trigger = page.locator('.context7-widget .c7-launcher');
    const panel = page.locator('.context7-widget [role="dialog"]');

    await hydrationStatus.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#hydration-status')?.textContent === 'hydration:ready');
    if ((await trigger.getAttribute('aria-expanded')) !== 'false') {
      throw new Error('Packed widget launcher did not hydrate into its closed state.');
    }

    await trigger.click();
    await panel.waitFor({ state: 'visible' });
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
      throw new Error('Packed widget launcher did not expose its open state.');
    }

    await page.getByRole('button', { name: 'Close chat' }).click();
    await panel.waitFor({ state: 'hidden' });
    if ((await trigger.getAttribute('aria-expanded')) !== 'false') {
      throw new Error('Packed widget launcher did not return to its closed state.');
    }
    if (browserErrors.length > 0) {
      throw new Error(`Packed consumer emitted browser errors: ${browserErrors.join('\n')}`);
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

async function fetchWhenReady(url: string, child: ReturnType<typeof spawn>, output: string[]): Promise<string> {
  const deadline = Date.now() + 90_000;
  let lastError = 'server did not respond';

  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Production server exited before readiness.\n${trimOutput(output.join(''))}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return response.text();
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
  }

  throw new Error(`Production server readiness timed out: ${lastError}.\n${trimOutput(output.join(''))}`);
}

async function reservePort(): Promise<number> {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a local TCP port.'));
        return;
      }

      server.close((error) => {
        if (error) reject(error);
        else resolvePort(address.port);
      });
    });
  });
}

function assertContains(source: string, expected: string, label: string): void {
  if (!source.includes(expected)) throw new Error(`${label} does not contain ${JSON.stringify(expected)}.`);
}

function containsQuotedSpecifier(source: string, specifier: string): boolean {
  return source.includes(`'${specifier}'`) || source.includes(`"${specifier}"`);
}

function fileDependency(path: string): string {
  return `file:${path}`;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function run(
  command: string,
  args: readonly string[],
  options: Readonly<{ cwd: string; label: string; timeoutMs?: number }>
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 120_000;
  console.info(`[packed-consumer] ${options.label}`);

  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    let timedOut = false;
    const append = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 100_000) output = output.slice(-100_000);
    };

    child.stdout?.on('data', append);
    child.stderr?.on('data', append);
    child.once('error', reject);

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.once('close', (code, signal) => {
      clearTimeout(timer);
      if (code === 0 && !timedOut) {
        resolveRun(output);
        return;
      }

      const reason = timedOut ? `timed out after ${timeoutMs} ms` : `exited with ${code ?? signal ?? 'unknown status'}`;
      reject(
        new Error(
          `${options.label} ${reason}: ${[command, ...args].map(formatArgument).join(' ')}\n${trimOutput(output)}`
        )
      );
    });
  });
}

function formatArgument(argument: string): string {
  return /\s/.test(argument) ? JSON.stringify(argument) : argument;
}

function trimOutput(output: string): string {
  const trimmed = output.trim();
  return trimmed.length > 8_000 ? trimmed.slice(-8_000) : trimmed;
}
