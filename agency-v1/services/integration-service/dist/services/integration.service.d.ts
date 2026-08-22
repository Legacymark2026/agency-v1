export interface CreateIntegrationInput {
    companyId: string;
    provider: string;
    config?: any;
}
export declare class IntegrationService {
    /**
     * Obtener integraciones activas por empresa
     */
    static getIntegrations(companyId: string): Promise<any>;
    /**
     * Conectar/Crear una integración con transacción atómica
     */
    static connectIntegration(input: CreateIntegrationInput): Promise<any>;
}
