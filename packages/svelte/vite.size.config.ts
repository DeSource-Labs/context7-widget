import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));
const entryFile = process.env['CONTEXT7_SVELTE_SIZE_ENTRY_FILE'];
const outputDirectory = process.env['CONTEXT7_SVELTE_SIZE_OUT_DIR'];
const serverBuild = process.env['CONTEXT7_SVELTE_SIZE_SSR'] === 'true';

if (!entryFile) throw new Error('CONTEXT7_SVELTE_SIZE_ENTRY_FILE is required');
if (!outputDirectory) throw new Error('CONTEXT7_SVELTE_SIZE_OUT_DIR is required');

export default defineConfig({
  plugins: [svelte({ configFile: path.join(packageRoot, 'svelte.config.js') })],
  resolve: {
    alias: {
      '@desource/context7-widget/kit': path.join(packageRoot, '../core/dist/kit.js')
    }
  },
  build: {
    emptyOutDir: true,
    lib: serverBuild
      ? undefined
      : {
          entry: entryFile,
          fileName: () => 'consumer.js',
          formats: ['es']
        },
    minify: 'esbuild',
    outDir: outputDirectory,
    rollupOptions: {
      external: (id) => id === 'svelte' || id.startsWith('svelte/'),
      output: {
        chunkFileNames: 'chunks/[name].js',
        entryFileNames: 'consumer.js'
      }
    },
    ssr: serverBuild ? entryFile : false,
    target: 'es2020'
  }
});
