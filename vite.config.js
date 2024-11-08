import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      vue: require.resolve("vue/dist/vue.runtime.esm.js"),
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src"),
    },
  },
  root: ".",
  build: {
    outDir: "dist",
  },
});
