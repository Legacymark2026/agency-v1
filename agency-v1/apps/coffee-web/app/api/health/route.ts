import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Endpoint de diagnóstico para verificar el estado de la base de datos Goldneez.
 * Útil para confirmar que las variables de entorno están configuradas en Vercel.
 */
export async function GET() {
  const dbUrl =
    process.env.GOLDNEEZ_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_EXTERNAL_URL;

  const envStatus = {
    GOLDNEEZ_DB_URL: !!process.env.GOLDNEEZ_DB_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_EXTERNAL_URL: !!process.env.POSTGRES_EXTERNAL_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    dbConfigured: !!dbUrl,
    // Solo mostrar primeros 30 chars de la URL por seguridad
    dbUrlPreview: dbUrl ? `${dbUrl.substring(0, 40)}...` : "NOT SET",
  };

  if (!dbUrl) {
    return NextResponse.json(
      {
        status: "error",
        message: "Base de datos no configurada. Agrega GOLDNEEZ_DB_URL en Vercel.",
        env: envStatus,
      },
      { status: 503 }
    );
  }

  // Intentar conexión real
  try {
    const { default: prisma } = await import("../../../lib/prisma");
    // Query simple para verificar conexión
    await (prisma as any).$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({
      status: "ok",
      message: "Base de datos Goldneez conectada correctamente.",
      env: envStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "db_error",
        message: `Error de conexión: ${err.message}`,
        env: envStatus,
      },
      { status: 500 }
    );
  }
}
