/**
 * services/auth-service/src/types/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom Types and Interfaces for auth-service
 */

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  globalRole?: string | null;
  companies?: Array<{
    companyId: string;
    roleName: string;
    companyName: string;
  }>;
  cnf?: {
    jkt: string;
  };
}

export interface SessionInfo {
  sessionId: string;
  familyId: string;
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  globalRole: string | null;
  image: string | null;
}
