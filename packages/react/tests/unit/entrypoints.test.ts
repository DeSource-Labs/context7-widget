// @vitest-environment node

import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { build as buildWithEsbuild } from 'esbuild';
import { build as buildWithVite } from 'vite';
import { describe, expect, it } from 'vitest';
import viteConfig from '../../vite.config';

const externals = ['@desource/context7-widget/kit', 'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'];

describe('React package entrypoints', () => {
  it('keeps the component entry independent from the programmatic React DOM runtime', async () => {
    const output = await bundle('../../src/component.ts');

    expect(output.text).not.toContain('react-dom');
    expect(output.text).not.toContain('createRoot');
    expect(output.text).not.toContain('flushSync');
    expect(gzipSync(output.contents, { level: 9 }).byteLength).toBeLessThanOrEqual(7_000);
  });

  it('keeps React DOM isolated in the hook entry that needs programmatic mounting', async () => {
    const output = await bundle('../../src/hook.ts');

    expect(output.text).toContain('react-dom');
    expect(output.text).toContain('createRoot');
    expect(output.text).toContain('flushSync');
  });

  it('marks every built distribution entry and shared chunk as a React client boundary', async () => {
    const result = await buildWithVite({
      ...viteConfig,
      build: { ...viteConfig.build, write: false },
      configFile: false,
      logLevel: 'silent',
      plugins: []
    });
    const outputs = (Array.isArray(result) ? result : [result]) as Array<{
      readonly output: Array<{
        readonly code?: string;
        readonly fileName: string;
        readonly isEntry?: boolean;
        readonly name?: string;
        readonly type: string;
      }>;
    }>;
    const chunks = outputs.flatMap((output) => output.output).filter((item) => item.type === 'chunk');
    const entryNames = chunks.filter((chunk) => chunk.isEntry).map((chunk) => chunk.name);

    expect(entryNames).toEqual(expect.arrayContaining(['component', 'hook', 'index']));
    for (const chunk of chunks) {
      expect(chunk.code, `${chunk.fileName} must preserve the React client boundary.`).toMatch(/^['"]use client['"];/);
    }
  });
});

async function bundle(relativeEntry: string): Promise<{ readonly contents: Uint8Array; readonly text: string }> {
  const result = await buildWithEsbuild({
    bundle: true,
    entryPoints: [fileURLToPath(new URL(relativeEntry, import.meta.url))],
    external: externals,
    format: 'esm',
    logLevel: 'silent',
    minify: true,
    platform: 'browser',
    target: 'es2020',
    treeShaking: true,
    write: false
  });
  const output = result.outputFiles?.[0];
  if (!output) throw new Error('Expected esbuild to emit the React entrypoint.');
  return { contents: output.contents, text: output.text };
}
