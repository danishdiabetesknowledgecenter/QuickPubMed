import vue from "@vitejs/plugin-vue2";
import path from "path";
import { defineConfig } from "vite";
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
  css: {
    // Disable CSS code splitting to bundle all CSS into one file
    codeSplit: false,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        MainWrapper: path.resolve(__dirname, "views/main-wrapper.html"),
        SearchGallery: path.resolve(__dirname, "views/search-gallery.html"),
        SpecificArticles: path.resolve(__dirname, "views/specific-articles.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "assets/appSettings.css"; // Rename all CSS to appSettings.css
          }
          return "assets/[name].[ext]";
        },
      },
    },
  },
});
