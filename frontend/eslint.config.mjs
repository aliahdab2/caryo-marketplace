import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    ignores: [".next/**"], // Ignore the .next directory
    rules: {
      "@typescript-eslint/no-explicit-any": "error",             // ❌ Prevent using `any`
      "@typescript-eslint/no-unused-vars": ["error", {           // ❌ No unused vars unless start with _
        "argsIgnorePattern": "^_"
      }],
      "react-hooks/exhaustive-deps": "warn",                      // ⚠️ Warn if useEffect deps missing
      "no-console": "off",                                       // ⚠️ Warn on console.log (optional)
    },
  },
];

export default eslintConfig;
