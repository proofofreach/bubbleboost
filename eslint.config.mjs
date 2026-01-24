import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      "build/**",
      ".plasmo/**",
      "dist/**",
      "*.config.js",
      "*.config.mjs",
      "postcss.config.mjs",
      "tailwind.config.js",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
      globals: {
        chrome: "readonly",
        document: "readonly",
        window: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        history: "readonly",
        MutationObserver: "readonly",
        Element: "readonly",
        HTMLElement: "readonly",
        HTMLImageElement: "readonly",
        NodeList: "readonly",
        Array: "readonly",
        Math: "readonly",
        JSON: "readonly",
        String: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      // TypeScript strict rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // React rules
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Import rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          pathGroups: [
            {
              pattern: "~/**",
              group: "internal",
            },
            // Plasmo asset imports go at the end
            {
              pattern: "data-text:*",
              group: "object",
            },
            {
              pattern: "data-text:~*",
              group: "object",
            },
            {
              pattern: "data-base64:*",
              group: "object",
            },
          ],
          pathGroupsExcludedImportTypes: [],
          "newlines-between": "never",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-duplicates": "error",
      "import/no-unresolved": "off", // TypeScript handles this, Plasmo has special imports

      // General rules
      "no-console": "off",
      "no-unused-vars": "off", // Use TypeScript's version
      "no-undef": "off", // TypeScript handles this
    },
  },
];
