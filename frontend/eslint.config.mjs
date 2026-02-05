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
    },
  },
];

export default eslintConfig;
