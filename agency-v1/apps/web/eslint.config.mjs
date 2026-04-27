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
    // Test files — less strict rules
    "tests/**",
    "cypress/**",
  ]),
  {
    rules: {
      // 2.4: Forzar uso del componente <Image> de Next.js para optimización automática
      // Las <img> nativas no se optimizan (WebP, lazy loading, size hints)
      "@next/next/no-img-element": "error",

      // Prevenir console.log en Server Actions (usar logger.info en su lugar)
      // Excepciones: console.error y console.warn se permiten para errores reales
      "no-console": ["warn", { allow: ["error", "warn"] }],
    },
  },
]);

export default eslintConfig;
