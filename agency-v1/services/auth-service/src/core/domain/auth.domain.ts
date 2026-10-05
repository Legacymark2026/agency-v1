/**
 * Auth Service — Pure Identity & Credential Domain Entities (AuthN IdP)
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero framework dependencies.
 * Confined strictly to: Identity, Credential Validation, Session Lifecycle,
 * Cryptographic Token Claims, and Multi-Factor Authentication.
 */

export const ALLOWED_ROLES = ["super_admin", "admin", "manager", "agent", "client", "user"] as const;
export type UserRole = (typeof ALLOWED_ROLES)[number];

export function isRoleAllowed(role: string): boolean {
  return ALLOWED_ROLES.includes(role as any);
}

export interface UserIdentityProps {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
  isActive?: boolean;
  mfaEnabled?: boolean;
  createdAt?: Date;
}

export class UserDomain {
  public readonly id: string;
  public readonly email: string;
  public readonly role: UserRole;
  public readonly companyId?: string;
  public readonly isActive: boolean;
  public readonly mfaEnabled: boolean;
  public readonly createdAt: Date;

  constructor(
    id: string,
    email: string,
    role: UserRole,
    companyId?: string,
    isActive: boolean = true,
    mfaEnabled: boolean = false,
    createdAt: Date = new Date()
  ) {
    this.id = id;
    this.email = email.toLowerCase().trim();
    this.role = role;
    this.companyId = companyId;
    this.isActive = isActive;
    this.mfaEnabled = mfaEnabled;
    this.createdAt = createdAt;
  }

  /**
   * Generates standard identity claims for RS256 token signing
   */
  public toIdentityClaims(): Record<string, any> {
    return {
      sub: this.id,
      email: this.email,
      role: this.role,
      companyId: this.companyId || null,
      mfaVerified: this.mfaEnabled,
    };
  }
}
