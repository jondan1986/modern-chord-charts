import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-JS/TS directories
    ".github/**",
  ]),
  {
    rules: {
      // Downgrade from error to warn — the codebase uses `any` in many places;
      // these are style issues, not bugs, and can be addressed incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
      // Legitimate pattern: resetting form state when a modal opens
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
