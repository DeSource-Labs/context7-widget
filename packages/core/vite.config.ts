import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts', // widget usage
        kit: 'src/kit.ts', // framework related packages (Vue, React, etc.)
        core: 'src/core.ts' // core utilities and types
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
    // Keep preserved ESM modules and export identifiers readable. Nuxt
    // auto-import analysis can otherwise mistake one-letter bindings for Vue
    // helpers, while downstream application bundlers still minify normally.
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
