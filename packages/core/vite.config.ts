import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        kit: 'src/kit.ts'
      },
      fileName: (_format, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    sourcemap: true,
    target: 'es2020'
  },
  plugins: [
    dts({
      entryRoot: 'src',
      include: ['src'],
      outDir: 'dist'
    })
  ]
});
