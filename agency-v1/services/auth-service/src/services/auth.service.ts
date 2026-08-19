import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "@repositories/user.repository";
import { sessionRepository } from "@repositories/session.repository";
import { prisma } from "@agency/database"; // keep for cross-db company memberships if needed

export interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  /**
   * Autenticar usuario y generar JWT + Sesión Prisma
   */
  static async login(input: LoginInput, privateKey: string | null) {
    const { email, password, ipAddress, userAgent } = input;

    const user = await userRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (user.deactivatedAt) {
      throw new Error("ACCOUNT_DEACTIVATED");
    }

    // Obtener membresías de compañía
    let companyMemberships: Array<{
      companyId: string;
      roleName: string;
      company: { id: string; name: string };
    }> = [];

    try {
      const rawMemberships = await (prisma as any).companyUser.findMany({
        where: { userId: user.id },
        include: { company: { select: { id: true, name: true } } },
      });
      companyMemberships = rawMemberships ?? [];
    } catch {
      // Ignorar errores de relación cross-db
    }

    const signKey = privateKey || process.env.JWT_SECRET || "dev-secret-change-me";
    const signOptions: jwt.SignOptions = { expiresIn: "24h" };
    if (privateKey) {
      signOptions.algorithm = "RS256";
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        globalRole: user.globalRole,
        companies: companyMemberships.map((c) => ({
          companyId: c.companyId,
          roleName: c.roleName,
          companyName: c.company?.name ?? "",
        })),
      },
      signKey,
      signOptions
    );

    const session = await sessionRepository.create({
      userId: user.id,
      sessionToken: token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    return {
      token,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        globalRole: user.globalRole,
        image: user.image,
      },
    };
  }

  /**
   * Obtener perfil de usuario autenticado
   */
  static async getUserProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      globalRole: user.globalRole,
      image: user.image,
      createdAt: user.createdAt,
    };
  }
}
