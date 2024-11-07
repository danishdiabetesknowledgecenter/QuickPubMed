import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      vue: path.resolve(__dirname, "node_modules/vue/dist/vue.runtime.esm.js"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  root: ".",
  build: {
    outDir: "dist",
  },
});
