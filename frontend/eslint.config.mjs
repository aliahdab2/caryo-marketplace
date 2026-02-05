import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  // Global ignores
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "out/**",
      "build/**",
      "dist/**",
      "__mocks__/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      ".husky/**",
      "public/**",
      "scripts/**",
    ],
  },

  // Next.js recommended configs (native flat config)
  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "react-hooks/exhaustive-deps": "warn",
      "no-console": "off",

      // React Compiler lint rules (from react-hooks v5 / eslint-config-next 16).
      // These enforce patterns needed for the React Compiler's automatic memoization.
      // Disabled until the codebase adopts the React Compiler — common patterns like
      // hydration guards (setMounted in useEffect) and server component try/catch
      // are flagged as errors despite being standard React/Next.js practice.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
];

export default eslintConfig;
