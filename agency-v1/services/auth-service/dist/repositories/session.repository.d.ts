/**
 * services/auth-service/src/repositories/session.repository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Session Repository Pattern Abstraction
 */
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
export declare class PrismaSessionRepository implements ISessionRepository {
    create(data: {
        userId: string;
        sessionToken: string;
        expires: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
    }): Promise<SessionEntity>;
    deleteByToken(token: string): Promise<void>;
}
export declare const sessionRepository: PrismaSessionRepository;
