// @vitest-environment node

import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const packageDirectory = fileURLToPath(new URL('../..', import.meta.url));

describe('server entry', () => {
  it('imports without DOM globals and defers browser validation until mount', async () => {
    expect(globalThis.document).toBeUndefined();
    const script = String.raw`
      import path from 'node:path';
      import { svelte } from '@sveltejs/vite-plugin-svelte';
      import { createServer } from 'vite';

      const server = await createServer({
        appType: 'custom',
        configFile: false,
        logLevel: 'silent',
        plugins: [svelte({ configFile: path.resolve('svelte.config.js') })],
        resolve: {
          alias: [
            { find: '@desource/context7-widget/kit', replacement: path.resolve('../core/src/kit.ts') },
            { find: '@desource/context7-widget', replacement: path.resolve('../core/src/index.ts') }
          ]
        },
        server: { hmr: false, middlewareMode: true }
      });
      try {
        const entry = await server.ssrLoadModule('/src/index.ts');
        if (typeof entry.Context7Widget !== 'function' || typeof entry.createContext7Widget !== 'function') {
          throw new Error('Svelte package runtime exports are incomplete.');
        }
        const controller = entry.createContext7Widget({ library: '/owner/repo' });
        try {
          controller.mount();
          throw new Error('Server controller mount unexpectedly succeeded.');
        } catch (error) {
          if (!/browser/i.test(String(error))) throw error;
        }
        process.stdout.write('ok');
      } finally {
        await server.close();
      }
    `;
    const { stderr, stdout } = await execFileAsync(process.execPath, ['--input-type=module', '--eval', script], {
      cwd: packageDirectory,
      env: { ...process.env, NO_COLOR: '1' }
    });

    expect(stderr).toBe('');
    expect(stdout).toBe('ok');
  });
});
