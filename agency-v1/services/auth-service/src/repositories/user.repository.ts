/**
 * services/auth-service/src/repositories/user.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User Repository Pattern Abstraction
 */

import { prisma } from "@agency/database";
import { UserEntity } from "@models/user.model";

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
      return user as UserEntity;
    } catch (err: any) {
      console.error(`[PrismaUserRepository] update error: ${err.message}`);
      throw err;
    }
  }
}

// Export singleton instance of the repository
export const userRepository = new PrismaUserRepository();
