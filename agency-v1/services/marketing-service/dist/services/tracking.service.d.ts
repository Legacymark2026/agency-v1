export interface TrackingTokenPayload {
    recipientId: string;
    blastId: string;
    email: string;
    companyId: string;
}
export declare class TrackingService {
    /**
     * Generar token firmado de seguimiento
     */
    static generateToken(payload: TrackingTokenPayload): string;
    /**
     * Verificar y decodificar token de seguimiento
     */
    static verifyToken(token: string): TrackingTokenPayload;
    /**
     * Inyectar píxel de seguimiento 1x1 y reescribir enlaces HTML para medir clics
     */
    static injectTracking(htmlBody: string, payload: TrackingTokenPayload, baseUrl: string): string;
    /**
     * Generar cabeceras RFC 8058 (List-Unsubscribe & List-Unsubscribe-Post)
     */
    static getUnsubscribeHeaders(payload: TrackingTokenPayload, baseUrl: string): Record<string, string>;
}
