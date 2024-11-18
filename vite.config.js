import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import path from "path";
import { fileURLToPath } from "url";

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
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        MainWrapper: path.resolve(__dirname, "main-wrapper.html"),
        SearchGallery: path.resolve(__dirname, "search-gallery.html"),
        SpecificArticles: path.resolve(__dirname, "specific-articles.html"),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});