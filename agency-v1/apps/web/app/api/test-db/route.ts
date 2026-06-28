import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      user: {
        email: user?.email,
        name: user?.name,
      },
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? "defined" : "undefined",
        AUTH_DATABASE_URL: process.env.AUTH_DATABASE_URL ? "defined" : "undefined",
        __DB_ENV__: (globalThis as any).__DB_ENV__ ? "defined" : "undefined",
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack,
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? "defined" : "undefined",
        AUTH_DATABASE_URL: process.env.AUTH_DATABASE_URL ? "defined" : "undefined",
        __DB_ENV__: (globalThis as any).__DB_ENV__ ? "defined" : "undefined",
      }
    }, { status: 500 });
  }
}
