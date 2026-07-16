import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/auto.ts',
      fileName: () => 'widget.js',
      formats: ['iife'],
      name: 'Context7WidgetLoader'
    },
    minify: true,
    sourcemap: true,
    target: 'es2020'
  }
});
