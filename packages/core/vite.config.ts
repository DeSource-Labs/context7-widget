import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        core: 'src/core.ts',
        index: 'src/index.ts',
        kit: 'src/kit.ts'
      },
      fileName: (_format, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src'
      }
    },
    // Keep preserved ESM modules and export identifiers readable,
    // downstream application bundlers still minify normally.
    minify: false,
    sourcemap: true,
    target: 'es2020'
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src'],
      outDirs: 'dist'
    })
  ]
});
