import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Global ignores - these need to be in a separate object at the root level
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
    ],
  },
  
  // Apply Next.js configurations with explicit plugin detection
  ...compat.config({ 
    extends: ["next/core-web-vitals", "next/typescript"],
    env: {
      browser: true,
      es6: true,
      node: true,
    },
  }),

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",             // ❌ Prevent using `any`
      "@typescript-eslint/no-unused-vars": ["error", {           // ❌ No unused vars unless start with _
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "react-hooks/exhaustive-deps": "warn",                      // ⚠️ Warn if useEffect deps missing
      "no-console": "off",                                       // ⚠️ Warn on console.log (optional)
    },
  },
];

export default eslintConfig;
