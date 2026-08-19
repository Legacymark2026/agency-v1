/**
 * services/auth-service/src/repositories/session.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Session Repository Pattern Abstraction
 */

import { prisma } from "@agency/database";

export interface SessionEntity {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionRepository {
  create(data: {
    userId: string;
    sessionToken: string;
    expires: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<SessionEntity>;
  deleteByToken(token: string): Promise<void>;
}

export class PrismaSessionRepository implements ISessionRepository {
  async create(data: {
    userId: string;
    sessionToken: string;
    expires: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<SessionEntity> {
    try {
      const session = await prisma.session.create({
        data,
      });
      return session as SessionEntity;
    } catch (err: any) {
      console.error(`[PrismaSessionRepository] create error: ${err.message}`);
      throw err;
    }
  }

  async deleteByToken(token: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { sessionToken: token },
      });
    } catch (err: any) {
      console.error(`[PrismaSessionRepository] deleteByToken error: ${err.message}`);
      throw err;
    }
  }
}

// Export singleton instance of the repository
export const sessionRepository = new PrismaSessionRepository();
