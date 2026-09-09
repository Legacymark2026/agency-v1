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

    // Consulta estricta contra base de datos - Sin backdoors ni claves fijas
    const user = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Generar token criptográfico firmado HMAC-SHA256
    const token = await createSignedToken({ email: user.email });
    await setAdminSession(user.email);

    const isHttps =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ||
      process.env.COOKIE_SECURE === "true";

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
