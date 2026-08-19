/**
 * services/auth-service/src/models/user.model.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User Domain Entity Mapping
 */

export interface UserEntity {
  id: string;
  email: string;
  name?: string | null;
  passwordHash?: string | null;
  role: string;
  globalRole?: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  twoFactorBackupCodes?: string[] | null;
  image?: string | null;
  deactivatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
