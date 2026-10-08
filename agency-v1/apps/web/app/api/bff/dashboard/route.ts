import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * BFF Aggregator API Route Handler — Next.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxies and unifies requests to the Backend for Frontend (BFF) engine on
 * API Gateway with session authentication and fallback.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user;

    const companyId = (user as any)?.companyId || req.nextUrl.searchParams.get("companyId") || "company_default";
    const userId = user?.id || req.nextUrl.searchParams.get("userId") || "user_default";
    const role = (user as any)?.role || "USER";
    const refresh = req.nextUrl.searchParams.get("refresh") === "true";

    const gatewayUrl = process.env.API_GATEWAY_URL || "http://api-gateway:8080";
    const targetUrl = `${gatewayUrl}/api/bff/dashboard?companyId=${encodeURIComponent(companyId)}&userId=${encodeURIComponent(userId)}&fresh=${refresh}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-company-id": companyId,
      "x-user-id": userId,
      "x-user-role": role,
    };

    // Forward Bearer token if present
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const bffRes = await fetch(targetUrl, {
      headers,
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!bffRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `BFF Gateway returned HTTP ${bffRes.status}`,
          hint: "Fallback to direct Server Actions",
        },
        { status: bffRes.status }
      );
    }

    const data = await bffRes.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-BFF-Provider": "api-gateway",
      },
    });
  } catch (error: any) {
    console.error("[NextBFF] Error delegating to API Gateway BFF:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal error in Next.js BFF proxy",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
