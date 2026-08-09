import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: { entry: 'src/index.ts', fileName: () => 'index.js', formats: ['es'] },
    rollupOptions: {
      external: ['@desource/context7-widget/kit', 'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']
    },
    sourcemap: true,
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
