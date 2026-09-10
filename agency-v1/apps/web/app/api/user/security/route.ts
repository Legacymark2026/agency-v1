import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getPersonalSecurityOverview, 
  getActiveSessions, 
  revokeSession, 
  revokeAllOtherSessions,
  emergencyLockdown 
} from "@/actions/settings";
import { z } from "zod";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const overview = await getPersonalSecurityOverview();
    const sessions = await getActiveSessions();

    return NextResponse.json({
      success: true,
      data: {
        overview,
        sessionsCount: Array.isArray(sessions) ? sessions.length : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

const SecurityActionSchema = z.object({
  action: z.enum(["revoke_session", "revoke_all_other", "emergency_lockdown"]),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = SecurityActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Acción inválida", details: parsed.error.flatten() }, { status: 400 });
    }

    const { action, sessionId } = parsed.data;

    if (action === "revoke_session") {
      if (!sessionId) {
        return NextResponse.json({ success: false, error: "sessionId es requerido" }, { status: 400 });
      }
      const res = await revokeSession(sessionId);
      return NextResponse.json(res);
    }

    if (action === "revoke_all_other") {
      const res = await revokeAllOtherSessions();
      return NextResponse.json(res);
    }

    if (action === "emergency_lockdown") {
      const res = await emergencyLockdown();
      return NextResponse.json(res);
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
