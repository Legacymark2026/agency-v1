export interface ServiceRegistry {
    [key: string]: string;
}
export declare class GatewayService {
    /**
     * Resolver la URL de un microservicio por nombre
     */
    static resolveServiceUrl(name: string): string;
    /**
     * Verificar token JWT via gRPC con fallback HTTP
     */
    static verifyToken(token: string): Promise<{
        valid: boolean;
        userId?: string;
        companyId?: string;
    }>;
}
