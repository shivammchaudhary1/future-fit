import eslint from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...compat
    .extends("next/core-web-vitals")
    .map((config) => ({ ...config, files: ["apps/web/**/*.{ts,tsx}"] })),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
);
