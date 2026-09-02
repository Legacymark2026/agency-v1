import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path = "/", referrer = "", eventType = "pageview", metadata = null } = body;

    const userAgent = req.headers.get("user-agent") || "";
    let deviceType = "desktop";
    if (/mobile/i.test(userAgent)) {
      deviceType = "mobile";
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = "tablet";
    }

    await prisma.analyticsEvent.create({
      data: {
        path: String(path).slice(0, 200),
        referrer: String(referrer || "").slice(0, 300),
        userAgent: userAgent.slice(0, 300),
        deviceType,
        eventType: String(eventType).slice(0, 50),
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving analytics event:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
