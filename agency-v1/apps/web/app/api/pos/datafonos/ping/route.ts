import { NextResponse } from "next/server";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const res = await fetch(`${POS_SERVICE_URL}/api/pos/datafonos/ping`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            status: "OFFLINE",
            responseTimeMs: 0,
            handshake: "FALLA_CONEXION_MICROSERVICIO",
            message: `❌ No se pudo establecer conexión con el microservicio POS: ${e.message}`
        }, { status: 503 });
    }
}
