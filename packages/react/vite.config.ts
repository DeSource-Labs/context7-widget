import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: { component: 'src/component.ts', hook: 'src/hook.ts', index: 'src/index.ts' },
      fileName: (_format, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: ['@desource/context7-widget/kit', 'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
      output: { banner: "'use client';" }
    },
    sourcemap: false,
    target: 'es2020'
  },
  plugins: [
    react(),
    dts({
      bundleTypes: true,
      entryRoot: 'src',
      include: ['src'],
      outDirs: 'dist',
      pathsToAliases: false,
      tsconfigPath: 'tsconfig.json'
    })
  ]
});
