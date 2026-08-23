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
    minify: 'terser',
    sourcemap: false,
    target: 'es2020',
    terserOptions: {
      compress: { passes: 3, pure_getters: true, toplevel: true },
      format: { comments: false },
      mangle: { toplevel: true }
    }
  }
});
