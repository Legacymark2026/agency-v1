import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Endpoint de diagnóstico para verificar el estado de la base de datos Goldneez.
 * SIEMPRE devuelve 200 con info detallada para facilitar el diagnóstico.
 */
export async function GET() {
  const goldneezDbUrl = process.env.GOLDNEEZ_DB_URL;
  const databaseUrl = process.env.DATABASE_URL;
  const postgresExternalUrl = process.env.POSTGRES_EXTERNAL_URL;

  const activeUrl = goldneezDbUrl || databaseUrl || postgresExternalUrl;

  const envStatus = {
    GOLDNEEZ_DB_URL: goldneezDbUrl ? `SET (${goldneezDbUrl.substring(0, 50)}...)` : "NOT SET ❌",
    DATABASE_URL: databaseUrl ? `SET (${databaseUrl.substring(0, 50)}...)` : "NOT SET",
    POSTGRES_EXTERNAL_URL: postgresExternalUrl
      ? `SET (${postgresExternalUrl.substring(0, 50)}...)`
      : "NOT SET",
    JWT_SECRET: process.env.JWT_SECRET ? "SET ✅" : "NOT SET (using default)",
    activeUrl: activeUrl ? `Using: ${activeUrl.substring(0, 60)}...` : "NO URL FOUND ❌",
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  if (!activeUrl) {
    return NextResponse.json(
      {
        status: "error",
        message: "❌ No hay URL de base de datos configurada. Agrega GOLDNEEZ_DB_URL en Vercel Settings → Environment Variables y haz Redeploy.",
        instructions: {
          step1: "Ve a vercel.com → tu proyecto coffee-web",
          step2: "Settings → Environment Variables → Add New",
          step3: "Nombre: GOLDNEEZ_DB_URL",
          step4: "Valor: postgresql://legacyuser:...@187.77.195.9:5432/legacymark?schema=goldneez&search_path=goldneez,public",
          step5: "Selecciona Production + Preview + Development",
          step6: "Save → Deployments → Redeploy (obligatorio)",
        },
        env: envStatus,
      },
      { status: 200 } // Siempre 200 para poder leer la respuesta
    );
  }

  // Verificar si la URL parece ser de goldneez o de otro schema
  const isGoldneezUrl =
    activeUrl.includes("goldneez") || activeUrl.includes("schema=goldneez");

  if (!isGoldneezUrl) {
    return NextResponse.json(
      {
        status: "wrong_db",
        message: "⚠️ La URL de base de datos NO apunta al schema goldneez. Revisa que la URL contenga ?schema=goldneez",
        env: envStatus,
      },
      { status: 200 }
    );
  }

  // Intentar conexión real
  try {
    const { default: prisma } = await import("../../../lib/prisma");
    await (prisma as any).$queryRaw`SELECT 1 as ok`;
    return NextResponse.json(
      {
        status: "ok",
        message: "✅ Base de datos Goldneez conectada correctamente.",
        env: envStatus,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "db_connection_error",
        message: `❌ Error de conexión: ${err.message}`,
        tip: "Verifica que el servidor de base de datos (187.77.195.9:5432) sea accesible desde Vercel. Es posible que necesites agregar las IPs de Vercel al firewall de PostgreSQL.",
        env: envStatus,
      },
      { status: 200 }
    );
  }
}
