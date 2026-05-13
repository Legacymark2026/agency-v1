import { NextResponse } from "next/server";

// This route has been migrated to the admin-service microservice.
// This stub exists to satisfy Next.js route validation.
// All traffic is routed through the API Gateway.

export async function GET() {
  return NextResponse.json(
    { message: "This endpoint has been migrated to admin-service. Use the API Gateway." },
    { status: 301 }
  );
}

export async function POST(request: Request) {
  return NextResponse.json(
    { message: "This endpoint has been migrated to admin-service. Use the API Gateway." },
    { status: 301 }
  );
}
