const js = require("@eslint/js");
const babelParser = require("@babel/eslint-parser");
const globals = require("globals");
const reactPlugin = require("eslint-plugin-react");

module.exports = [
  {
    ignores: [
      "client/dist/**",
      "node_modules/**",
      ".tmp/**",
      "webpack-build.log",
      "*.out",
      "*.err",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      react: reactPlugin,
    },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: "unambiguous",
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
        babelOptions: {
          presets: [
            [
              "@babel/preset-react",
              {
                runtime: "automatic",
                importSource: "preact",
              },
            ],
          ],
          plugins: [
            [
              "@babel/plugin-proposal-decorators",
              {
                version: "2023-05",
              },
            ],
          ],
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "react/jsx-uses-vars": "error",
    },
  },
  {
    files: ["server/static/openapi-reference/reference-init.js"],
    languageOptions: {
      globals: {
        SwaggerUIBundle: "readonly",
        SwaggerUIStandalonePreset: "readonly",
      },
    },
  },
];
