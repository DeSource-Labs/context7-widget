import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: () => 'index.js',
      formats: ['es']
    },
    rollupOptions: {
      external: ['@desource/context7-widget', '@desource/context7-widget/kit', 'vue']
    },
    sourcemap: true,
    target: 'es2020'
  },
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      include: ['src'],
      outDir: 'dist',
      pathsToAliases: false,
      tsconfigPath: 'tsconfig.json'
    })
  ]
});
