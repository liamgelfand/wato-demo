import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "config/jest.config.js",
    "config/jest.setup.js",
    "mobile/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    files: ["tests/**/*.{ts,tsx,js}", "tests/playwright.config.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react/display-name": "off",
    },
  },
  {
    files: ["app/legal/**/*.tsx", "app/safety/page.tsx"],
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
