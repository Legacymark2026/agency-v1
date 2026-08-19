/**
 * services/auth-service/src/repositories/user.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User Repository Pattern Abstraction
 */

import { prisma } from "@agency/database";
import { UserEntity } from "@models/user.model";
import { EventBus } from "@agency/events";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const eventBus = new EventBus(REDIS_URL, "auth-repository");

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
}

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user as UserEntity | null;
    } catch (err: any) {
      console.error(`[PrismaUserRepository] findById error: ${err.message}`);
      throw err;
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user as UserEntity | null;
    } catch (err: any) {
      console.error(`[PrismaUserRepository] findByEmail error: ${err.message}`);
      throw err;
    }
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: data as any,
      });

      // CDC / Dual-Write synchronization event emission
      await eventBus.publish("user.updated", {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        updatedAt: user.updatedAt.toISOString(),
      }).catch(err => console.warn("[UserRepository] Failed to publish user.updated event:", err.message));

      return user as UserEntity;
    } catch (err: any) {
      console.error(`[PrismaUserRepository] update error: ${err.message}`);
      throw err;
    }
  }
}

// Export singleton instance of the repository
export const userRepository = new PrismaUserRepository();
