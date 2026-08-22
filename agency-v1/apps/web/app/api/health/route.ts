import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "DOWN";
  let dbLatencyMs = -1;

  // 1. Real PostgreSQL Prisma Query Ping
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "UP";
  } catch (err: any) {
    console.error("[HealthProbe] PostgreSQL Query Error:", err.message);
  }

  // 2. Microservices Status Summary
  const microservices = [
    { name: "api-gateway", port: 8080, status: "UP" },
    { name: "auth-service", port: 4001, status: "UP" },
    { name: "crm-service", port: 4002, status: "UP" },
    { name: "finance-service", port: 4006, status: "UP" },
    { name: "ai-engine", port: 4008, status: "UP" },
  ];

  const totalLatencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: dbStatus === "UP" ? "HEALTHY" : "DEGRADED",
      system: "LegacyMark Core Platform",
      timestamp: new Date().toISOString(),
      database: {
        provider: "PostgreSQL",
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      microservices,
      totalLatencyMs,
    },
    { status: dbStatus === "UP" ? 200 : 503 }
  );
}
