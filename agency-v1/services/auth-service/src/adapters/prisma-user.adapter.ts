/**
 * Auth Service — Prisma User Repository Adapter
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { prisma } from "@agency/database";
import { IUserRepositoryPort } from "../core/ports/auth.ports";
import { UserDomain } from "../core/domain/auth.domain";

export class PrismaUserAdapter implements IUserRepositoryPort {
  public async save(user: UserDomain): Promise<UserDomain> {
    try {
      await (prisma as any).user.upsert({
        where: { id: user.id },
        update: {
          role: user.role,
          isActive: user.isActive,
        },
        create: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          isActive: user.isActive,
        },
      });
    } catch {}
    return user;
  }

  public async findByEmail(email: string): Promise<UserDomain | null> {
    try {
      const row = await (prisma as any).user.findUnique({ where: { email } });
      if (!row) return null;
      return new UserDomain(row.id, row.email, row.role as any, row.companyId, [], row.isActive);
    } catch {
      return null;
    }
  }

  public async findById(id: string): Promise<UserDomain | null> {
    try {
      const row = await (prisma as any).user.findUnique({ where: { id } });
      if (!row) return null;
      return new UserDomain(row.id, row.email, row.role as any, row.companyId, [], row.isActive);
    } catch {
      return null;
    }
  }
}
