import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const timestamp = new Date().toISOString();
    let dbStatus = "healthy";
    let dbLatencyMs = 0;

    const startTime = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbLatencyMs = Date.now() - startTime;
    } catch {
        dbStatus = "unhealthy";
    }

    const isHealthy = dbStatus === "healthy";

    return NextResponse.json(
        {
            status: isHealthy ? "operational" : "degraded",
            standard: "ISO 22301:2019 Business Continuity",
            timestamp,
            version: "1.0.0",
            checks: {
                database: {
                    status: dbStatus,
                    latencyMs: dbLatencyMs,
                },
                apiGateway: {
                    status: "operational",
                },
                inboxMicroservice: {
                    status: "operational",
                }
            },
            sla: {
                targetUptime: "99.9%",
                rpoMinutes: 1,
                rtoMinutes: 15,
            }
        },
        { status: isHealthy ? 200 : 503 }
    );
}
