import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import Icons from "unplugin-icons/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    solidPlugin(),
    Icons({
      compiler: "solid",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "UnrealEmoComponent",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["solid-js", "solid-js/web", "solid-js/store"],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        assetFileNames: "style.css",
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: false,
  },
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
});

