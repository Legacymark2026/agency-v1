export type TokenPair = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
};
export type SessionSessionInfo = {
    sessionId: string;
    familyId: string;
    userId: string;
    email: string;
    ip: string;
    userAgent: string;
    createdAt: string;
};
export declare class TokenRotationService {
    /**
     * Emite un par de tokens (Access 15m + Refresh 7d) y registra la sesión en Redis
     */
    static issueTokenPair(userId: string, email: string, ip?: string, userAgent?: string, existingFamilyId?: string): Promise<TokenPair>;
    /**
     * Rota un Refresh Token (RTR): Invalida el token anterior y emite uno nuevo.
     * Si se detecta un token consumido previamente (ataque de réplica), REVOCA TODAS LAS SESIONES DEL USUARIO.
     */
    static rotateRefreshToken(oldRefreshToken: string, ip?: string, userAgent?: string): Promise<TokenPair>;
    /**
     * Cierra la sesión activa actual en Redis
     */
    static logoutSession(userId: string, sessionId: string): Promise<void>;
    /**
     * Cierre de sesión de emergencia: Revoca TODAS las sesiones activas del usuario en Redis
     */
    static revokeAllUserSessions(userId: string): Promise<void>;
    /**
     * Obtiene la lista de sesiones activas del usuario
     */
    static getActiveUserSessions(userId: string): Promise<SessionSessionInfo[]>;
}
