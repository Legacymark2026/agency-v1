export declare class AffiliateService {
    /**
     * Obtener perfil de afiliado por userId
     */
    static getProfile(userId: string): Promise<any>;
    /**
     * Registrar clic en enlace de afiliado con transacción atómica
     */
    static trackClick(code: string, ipAddress?: string, userAgent?: string): Promise<any>;
}
