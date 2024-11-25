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
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@babel/eslint-parser", // Updated parser
    ecmaVersion: 2020,
    sourceType: "module",
    requireConfigFile: false, // Allows parsing without a Babel config
  },
  rules: {
    "prettier/prettier": "error",
    // Enforce kebab-case for attribute names (prop names)
    "vue/attribute-hyphenation": ["error", "always"],
    // Enforce component name casing in templates
    "vue/component-name-in-template-casing": [
      "error",
      "kebab-case",
      {
        registeredComponentsOnly: false,
        ignores: [],
      },
    ],
    // Add any additional custom rules here
  },
};
