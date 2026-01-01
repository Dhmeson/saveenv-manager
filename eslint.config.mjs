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
    // Regras globais
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_" 
      }],
    }
  },
  {
    // Ignorar completamente arquivos gerados
    ignores: [
      "**/generated/**",
      "**/*.generated.*",
      "**/prisma/migrations/**",
      ".next/**",
      "node_modules/**"
    ]
  },
  {
    // Para arquivos específicos do Prisma que não podem ser ignorados
    files: ["**/prisma/**/*.js", "**/wasm.js"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];

export default eslintConfig;