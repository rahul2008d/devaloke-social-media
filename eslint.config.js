// eslint.config.cjs
const typescriptParser = require("@typescript-eslint/parser");
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      "semi": ["error", "always"],
      "space-before-function-paren": ["off", { anonymous: "always", named: "always" }],
      "camelcase": "off",
      "no-return-assign": "off",
      "quotes": ["error", "single"],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
    ignores: ["node_modules"],
    settings: {
      "eslint:recommended": true,
      "plugin:@typescript-eslint/recommended": true,
      "prettier": true,
    },
  },
];
