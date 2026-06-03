"use server";

import { prisma } from "@agency/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "goldneez-coffee-exclusive-jwt-secret-2026";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";

/**
 * Registra un nuevo usuario en la base de datos de Goldneez
 */
export async function registerUserAction(name: string, email: string, password: string) {
  try {
    const emailLower = email.toLowerCase().trim();
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return { error: "Este correo electrónico ya está registrado." };
    }

    // Cifrar la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        name: name.trim(),
        firstName,
        lastName,
        passwordHash,
        role: "client_user", // Rol asignado por defecto para clientes de café
        globalRole: "client_user",
      },
    });

    // Crear un perfil inicial
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        preferences: JSON.stringify({
          theme: "dark",
          notifications: { email: true }
        }),
        metadata: JSON.stringify({
          points: 500, // Regalo de 500 puntos por registro
          registeredAt: new Date().toLocaleDateString()
        })
      }
    });

    // Iniciar sesión automáticamente
    return await loginUserAction(emailLower, password);

  } catch (err: any) {
    console.error("[registerUserAction] Error:", err);
    return { error: `Error en el registro: ${err.message}` };
  }
}

/**
 * Inicia sesión del usuario llamando a auth-service,
 * con fallback directo a base de datos de Goldneez si el microservicio está caído.
 */
export async function loginUserAction(email: string, password: string) {
  const emailLower = email.toLowerCase().trim();
  let sessionData = null;

  // 1. Intentar llamar al microservicio auth-service
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailLower, password }),
      // Corto tiempo de espera para reaccionar rápidamente si el servicio está caído
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      const data = await response.json();
      sessionData = {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        }
      };
      console.log("[loginUserAction] Autenticación exitosa mediante auth-service");
    }
  } catch (err: any) {
    console.warn("[loginUserAction] auth-service no disponible, usando fallback directo a DB:", err.message);
  }

  // 2. Fallback: Consulta directa a la base de datos si auth-service falló/no estuvo disponible
  if (!sessionData) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: { profile: true }
      });

      if (!user || !user.passwordHash) {
        return { error: "Credenciales inválidas." };
      }

      if (user.deactivatedAt) {
        return { error: "Tu cuenta ha sido desactivada." };
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return { error: "Credenciales inválidas." };
      }

      // Generar JWT exclusivo de Goldneez
      const token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          globalRole: user.globalRole,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Crear sesión en base de datos independiente
      await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      sessionData = {
        token,
        user: {
          id: user.id,
          email: user.email || "",
          name: user.name || "",
          role: user.role,
        }
      };
      console.log("[loginUserAction] Autenticación exitosa mediante fallback directo a DB");
    } catch (dbErr: any) {
      console.error("[loginUserAction] Error en fallback de base de datos:", dbErr);
      return { error: "Error en el servidor de autenticación." };
    }
  }

  // 3. Guardar token en cookies y registrar log de actividad
  try {
    const cookieStore = await cookies();
    cookieStore.set("goldneez_jwt", sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 día
      path: "/",
      sameSite: "lax",
    });

    // Registrar log de actividad
    await prisma.userActivityLog.create({
      data: {
        userId: sessionData.user.id,
        action: "LOGIN_SUCCESS",
        details: JSON.stringify({ source: "coffee-web" })
      }
    });

    // Retornar información para el cliente
    return {
      success: true,
      user: sessionData.user,
      token: sessionData.token,
    };
  } catch (err: any) {
    console.error("[loginUserAction] Error al guardar cookies:", err);
    return { error: "Error al establecer la sesión." };
  }
}

/**
 * Cierra la sesión eliminando las cookies
 */
export async function logoutUserAction() {
  try {
    const cookieStore = await cookies();
    
    // Obtener token para registrar actividad antes de borrarlo
    const token = cookieStore.get("goldneez_jwt")?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
        await prisma.userActivityLog.create({
          data: {
            userId: decoded.sub,
            action: "LOGOUT",
            details: JSON.stringify({ source: "coffee-web" })
          }
        });
      } catch {}
    }

    cookieStore.delete("goldneez_jwt");
    return { success: true };
  } catch (err: any) {
    console.error("[logoutUserAction] Error al cerrar sesión:", err);
    return { error: "Error al cerrar sesión." };
  }
}

/**
 * Valida el token de sesión y retorna los datos del usuario conectado
 */
export async function getMeAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("goldneez_jwt")?.value;

    if (!token) return null;

    let decoded: any = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { profile: true },
    });

    if (!user) return null;

    let points = 500;
    let registeredAt = new Date().toLocaleDateString();
    
    if (user.profile && user.profile.metadata) {
      try {
        const meta = typeof user.profile.metadata === "string" 
          ? JSON.parse(user.profile.metadata) 
          : user.profile.metadata;
        points = meta.points ?? 500;
        registeredAt = meta.registeredAt ?? registeredAt;
      } catch {}
    }

    return {
      id: user.id,
      email: user.email || "",
      name: user.name || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
      points,
      registeredAt,
      address: user.phone || "", // reutilizamos phone como dirección o lo dejamos vacío
    };
  } catch (err) {
    console.error("[getMeAction] Error:", err);
    return null;
  }
}

/**
 * Actualiza los datos de perfil del usuario
 */
export async function updateProfileAction(name: string, email: string, address: string, city: string) {
  try {
    const me = await getMeAction();
    if (!me) {
      return { error: "No autorizado. Inicie sesión." };
    }

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    // Actualizar usuario en tbl_users
    await prisma.user.update({
      where: { id: me.id },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        phone: address, // Guardar dirección en el campo de teléfono de forma simple
      },
    });

    // Actualizar perfil
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: me.id }
    });

    const metadata = {
      points: me.points,
      registeredAt: me.registeredAt,
      city: city.trim(),
    };

    if (userProfile) {
      await prisma.userProfile.update({
        where: { userId: me.id },
        data: {
          metadata: JSON.stringify(metadata)
        }
      });
    } else {
      await prisma.userProfile.create({
        data: {
          userId: me.id,
          preferences: JSON.stringify({}),
          metadata: JSON.stringify(metadata)
        }
      });
    }

    // Registrar actividad
    await prisma.userActivityLog.create({
      data: {
        userId: me.id,
        action: "UPDATE_PROFILE",
        details: JSON.stringify({ source: "coffee-web" })
      }
    });

    return { success: true };
  } catch (err: any) {
    console.error("[updateProfileAction] Error:", err);
    return { error: `Error al actualizar perfil: ${err.message}` };
  }
}
