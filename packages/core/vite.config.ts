import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: () => "index.js",
      formats: ["es"]
    },
    sourcemap: true,
    target: "es2020"
  },
  plugins: [
    dts({
      entryRoot: "src",
      include: ["src"],
      outDir: "dist"
    })
  ]
});
