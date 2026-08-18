import { NextResponse } from "next/server";
import { PLATFORM_VERSION } from "@/lib/version";

export async function GET() {
  return NextResponse.json({
    success: true,
    platform: "LegacyMark Agency V1",
    data: PLATFORM_VERSION,
    timestamp: new Date().toISOString(),
  });
}
