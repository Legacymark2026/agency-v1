/**
 * middleware/debug-guard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Mejora 6.2: Protección de rutas de debug y diagnóstico.
 *
 * Las siguientes rutas solo deben estar accesibles en entornos de desarrollo:
 *   - /api/diagnostics/*
 *   - /api/test-flow/*
 *   - /api/test-marketing/*
 *   - /app/test-cloudinary/*
 *   - /app/test_auth_debug/*
 *
 * INTEGRACIÓN: Importar y llamar a `guardDebugRoute(pathname)` al inicio del
 * middleware principal antes de cualquier otra lógica.
 *
 * @example
 * // En middleware.ts:
 * import { guardDebugRoute } from "@/middleware/debug-guard";
 * const debugBlock = guardDebugRoute(pathname);
 * if (debugBlock) return debugBlock;
 */

import { NextRequest, NextResponse } from "next/server";

const DEBUG_ROUTE_PREFIXES = [
  "/api/diagnostics",
  "/api/test-flow",
  "/api/test-marketing",
  "/test-cloudinary",
  "/test_auth_debug",
];

/**
 * Bloquea rutas de debug en producción.
 * Devuelve un NextResponse 404 si la ruta es de debug y el entorno es producción.
 * Devuelve null si la ruta no es de debug o el entorno es desarrollo.
 */
export function guardDebugRoute(
  req: NextRequest
): NextResponse | null {
  const pathname = req.nextUrl.pathname;
  const isDebugRoute = DEBUG_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isDebugRoute) return null;

  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) return null; // Permitir en desarrollo

  // En producción: bloquear con 404 (no revelar existencia de la ruta)
  return NextResponse.json(
    { error: "Not Found" },
    { status: 404 }
  );
}
