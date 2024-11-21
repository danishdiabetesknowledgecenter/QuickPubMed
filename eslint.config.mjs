import globals from "globals";
import pluginJs from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // Add Prettier rules (shows Prettier errors as ESLint errors)
      ...pluginPrettier.configs.recommended.rules,
    },
  },
  // JavaScript recommended rules
  pluginJs.configs.recommended,
  // Vue.js recommended rules
  ...pluginVue.configs["flat/vue2-recommended"],
  // Disable ESLint rules that might conflict with Prettier
  configPrettier,
];
