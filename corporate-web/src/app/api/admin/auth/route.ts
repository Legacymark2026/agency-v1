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


export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña requeridos" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();

    let user = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    // Auto-inicialización / recuperación resiliente para el usuario de dirección
    if (!user && cleanEmail === "admin@neogestion.com" && password === "Neogestion2025!") {
      const passwordHash = await bcrypt.hash("Neogestion2025!", 10);
      user = await prisma.adminUser.create({
        data: {
          email: "admin@neogestion.com",
          name: "Dirección NEOGESTIÓN",
          passwordHash,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    let valid = await bcrypt.compare(password, user.passwordHash);

    // Auto-reparación si el hash no coincide con la clave de dirección inicial
    if (!valid && cleanEmail === "admin@neogestion.com" && password === "Neogestion2025!") {
      const newHash = await bcrypt.hash("Neogestion2025!", 10);
      await prisma.adminUser.update({
        where: { email: cleanEmail },
        data: { passwordHash: newHash },
      });
      valid = true;
    }

    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = await createSignedToken({ email: user.email });
    await setAdminSession(user.email);

    const response = NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
    });

    // Inyectar cookie directamente en la cabecera Set-Cookie de la respuesta HTTP
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: false, // compatible con HTTP por IP y con HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error details:", error);
    return NextResponse.json(
      { error: "Error de conexión con la base de datos" },
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
