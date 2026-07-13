import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      // Only the two classic hooks rules the codebase's existing
      // eslint-disable comments already target — the rest of v7's
      // "recommended" preset (ref-during-render, setState-in-effect, etc.)
      // is a much stricter, newer ruleset that would need a separate pass.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([
    "**/out/**",
    "**/dist/**",
    "**/dist-web/**",
    "**/node_modules/**",
    // The backend is a separate Node/Fastify project with its own
    // tsc/vitest pipeline — this config targets the browser/Electron app.
    "server/**",
  ]),
]);

export default eslintConfig;
