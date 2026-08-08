import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/widget/auto.ts',
      fileName: () => 'widget.js',
      formats: ['iife'],
      name: 'Context7WidgetLoader'
    },
    minify: 'terser',
    sourcemap: true,
    target: 'es2020'
  }
});
