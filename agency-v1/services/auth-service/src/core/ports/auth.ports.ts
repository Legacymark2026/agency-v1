/**
 * Auth Service — Hexagonal Ports (Inbound & Outbound Interfaces)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { UserDomain, UserRole } from "../domain/auth.domain";

export interface RegisterDTO {
  email: string;
  role?: UserRole;
  companyId?: string;
  permissions?: string[];
}

export interface IAuthUseCases {
  register(dto: RegisterDTO): Promise<UserDomain>;
  issueToken(user: UserDomain): string;
  verifyToken(token: string): any;
  checkAccess(user: UserDomain, requiredPermission: string): boolean;
}

export interface IUserRepositoryPort {
  save(user: UserDomain): Promise<UserDomain>;
  findByEmail(email: string): Promise<UserDomain | null>;
  findById(id: string): Promise<UserDomain | null>;
}

export interface ITokenSignerPort {
  sign(payload: Record<string, any>): string;
  verify(token: string): any;
}

export interface IAuthEventPublisherPort {
  publishEvent(topic: string, event: Record<string, any>): Promise<void>;
}
