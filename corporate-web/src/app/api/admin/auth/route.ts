import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { 
  setAdminSession, 
  clearAdminSession, 
  getAdminSession, 
  ADMIN_COOKIE_NAME, 
  createSignedToken 
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitKey = `auth_attempt_${clientIp}`;

    // Protección anti-fuerza bruta: máximo 5 intentos cada 15 minutos por IP
    const rateCheck = checkRateLimit(rateLimitKey, {
      maxRequests: 5,
      windowSeconds: 15 * 60,
    });

    if (!rateCheck.success) {
      const waitMinutes = Math.ceil(rateCheck.resetSeconds / 60);
      return NextResponse.json(
        { 
          error: `Acceso temporalmente bloqueado por seguridad tras múltiples intentos fallidos. Intente de nuevo en ${waitMinutes} minuto(s).` 
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.resetSeconds),
          },
        }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña requeridos" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Hash de respaldo para mantener tiempo constante contra ataques de temporización (Timing Attacks)
    const DUMMY_HASH = "$2a$12$e8k6mI07DqvJ4oK041o75.7nI4.G8m5a1lP7j6b7w6y9x8z5a1b2c";

    const user = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    const targetHash = user ? user.passwordHash : DUMMY_HASH;
    const valid = await bcrypt.compare(String(password), targetHash);

    if (!user || !valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Generar token criptográfico firmado HMAC-SHA256
    const token = await createSignedToken({ email: user.email });
    await setAdminSession(user.email);

    const forwardedProto = req.headers.get("x-forwarded-proto");
    const host = req.headers.get("host") || "";
    // Si se accede por IP directa (ej: 187.77.195.9) y protocolo HTTP, NUNCA poner secure: true porque el navegador la rechaza
    const isDirectIp = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(host);
    const isHttps = !isDirectIp && (
      forwardedProto === "https" ||
      req.nextUrl.protocol === "https:" ||
      process.env.COOKIE_SECURE === "true"
    );

    const response = NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
    });

    // Inyectar cookie directamente con SameSite y protección estricta
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error details:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la solicitud" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearAdminSession();
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}


export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, email: session.email });
}
