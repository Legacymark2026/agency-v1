import { NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "http://api-gateway:8080";

export async function GET(req: Request) {
  try {
    const res = await fetch(`${API_GATEWAY_URL}/api/v1/admin/pricing`, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        pricing: {
          "/api/v1/agents":  { unitType: "TOKENS", costPerUnitUsd: 0.0000025 },
          "/api/v1/video":   { unitType: "SECONDS", costPerUnitUsd: 0.05 },
          "/api/v1/invoices": { unitType: "DOCUMENTS", costPerUnitUsd: 0.08 },
          "default":         { unitType: "REQUESTS", costPerUnitUsd: 0.0005 },
        }
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      pricing: {
        "/api/v1/agents":  { unitType: "TOKENS", costPerUnitUsd: 0.0000025 },
        "/api/v1/video":   { unitType: "SECONDS", costPerUnitUsd: 0.05 },
        "/api/v1/invoices": { unitType: "DOCUMENTS", costPerUnitUsd: 0.08 },
        "default":         { unitType: "REQUESTS", costPerUnitUsd: 0.0005 },
      }
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${API_GATEWAY_URL}/api/v1/admin/pricing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Error de conexión con API Gateway" }, { status: 500 });
  }
}
