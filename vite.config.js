// vite.config.js
import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toLowerAssetPath(fileName, fallback = "asset") {
  const parsed = path.parse(String(fileName || fallback));
  const normalizedName = (parsed.name || fallback).toLowerCase();
  const normalizedExt = (parsed.ext || "").toLowerCase();
  return `${normalizedName}${normalizedExt}`;
}

export default defineConfig(({ command }) => {
  // Define common input files
  const input = {
    searchform: path.resolve(__dirname, "entries/widgets/searchform.html"),
    searchstrings: path.resolve(__dirname, "entries/widgets/searchstrings.html"),
    references: path.resolve(__dirname, "entries/widgets/references.html"),
    editor: path.resolve(__dirname, "entries/widgets/editor.html"),
  };

  // Include index.html only in development
  if (command === "serve") {
    input.index = path.resolve(__dirname, "index.html");
  }

  return {
    base: "./",
    plugins: [vue()],
    server: {
      proxy: {
        "/backend": {
          target: "https://qpm.videncenterfordiabetes.dk/dev/latest",
          changeOrigin: true,
          secure: true,
        },
      },
    },
    resolve: {
      alias: {
        vue: "vue",
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Disable CSS code splitting to bundle all CSS into one file
      cssCodeSplit: false,
      outDir: "dist",
      rollupOptions: {
        input, // Use the conditional input
        output: {
          entryFileNames: (chunkInfo) => `assets/${String(chunkInfo.name || "entry").toLowerCase()}.js`,
          chunkFileNames: (chunkInfo) => `assets/${String(chunkInfo.name || "chunk").toLowerCase()}.js`,
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith(".css")) {
              return "assets/appsettings.css"; // Rename all CSS to appsettings.css
            }
            return `assets/${toLowerAssetPath(assetInfo.name, "asset")}`;
          },
        },
      },
    },
  };
});
