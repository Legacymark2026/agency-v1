import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exportAccountData } from "@/actions/settings";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const result = await exportAccountData();
    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, error: result.error || "Error al exportar datos" }, { status: 500 });
    }

    const jsonString = JSON.stringify(result.data, null, 2);
    const dateStr = new Date().toISOString().split("T")[0];
    const fileId = session.user.id ? session.user.id.slice(0, 8) : "user";
    const fileName = `legacymark-data-export-${fileId}-${dateStr}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
