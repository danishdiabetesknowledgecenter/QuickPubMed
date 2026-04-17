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

function toOutputName(name, fallback = "chunk") {
  const normalized = String(name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
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
        "/semantic-scholar-api": {
          target: "https://api.semanticscholar.org",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/semantic-scholar-api/, ""),
        },
        "/openalex-api": {
          target: "https://api.openalex.org",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/openalex-api/, ""),
        },
        "/elicit-api": {
          target: "https://elicit.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/elicit-api/, ""),
        },
        "/nlm-api": {
          target: "https://eutils.ncbi.nlm.nih.gov",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/nlm-api/, ""),
        },
        "/icite-api": {
          target: "https://icite.od.nih.gov",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/icite-api/, ""),
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
          entryFileNames: (chunkInfo) =>
            `assets/entries/${toOutputName(chunkInfo.name, "entry")}.js`,
          chunkFileNames: (chunkInfo) =>
            `assets/chunks/${toOutputName(chunkInfo.name, "chunk")}.js`,
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith(".css")) {
              return "assets/styles.css"; // Rename all CSS to styles.css
            }
            return `assets/${toLowerAssetPath(assetInfo.name, "asset")}`;
          },
          manualChunks: (id) => {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("axios")) return "vendor-http";
            if (id.includes("floating-vue") || id.includes("vue-showdown") || id.includes("/vue/")) {
              return "vendor-vue";
            }
            return "vendor-misc";
          },
        },
      },
    },
  };
});
