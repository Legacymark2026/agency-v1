import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAdminSession, clearAdminSession, getAdminSession } from "@/lib/auth";

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

    // Auto-inicialización resiliente: si no existe ningún admin en la BD, crearlo en el acto
    if (!user) {
      const count = await prisma.adminUser.count().catch(() => 0);
      if (count === 0 && cleanEmail === "admin@neogestion.com") {
        const passwordHash = await bcrypt.hash("Neogestion2025!", 10);
        user = await prisma.adminUser.create({
          data: {
            email: "admin@neogestion.com",
            name: "Dirección NEOGESTIÓN",
            passwordHash,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    await setAdminSession(user.email);

    return NextResponse.json({
      success: true,
      user: { name: user.name, email: user.email },
    });
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
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, email: session.email });
}
