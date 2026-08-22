export declare class PublicApiService {
    /**
     * Obtener información pública de la API v1
     */
    static getPublicStatus(): Promise<{
        name: string;
        version: string;
        status: string;
        documentationUrl: string;
        timestamp: string;
    }>;
}
