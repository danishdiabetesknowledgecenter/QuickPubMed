// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/recommended",
    "plugin:prettier/recommended", // Integrates Prettier with ESLint
  ],
  plugins: ["vue", "prettier"],
  parserOptions: {
    parser: "babel-eslint", // Use '@babel/eslint-parser' if preferred
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error",
    // Add any custom rules here
  },
};
