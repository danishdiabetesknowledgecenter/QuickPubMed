import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import path from "path";
import { fileURLToPath } from "url";

// Convert import.meta.url to __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default defineConfig({
  base: "./",
  plugins: [vue()],
  resolve: {
    alias: {
      vue: path.resolve(__dirname, "node_modules/vue/dist/vue.runtime.esm.js"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  root: "./",
  build: {
    outDir: "dist",
  },
});
