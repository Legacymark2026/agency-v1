/**
 * Credit System - The "Gasolina" de Credits
 * Sistema de créditos por empresa
 */
export interface CreditInfo {
    companyId: string;
    totalCredits: number;
    usedCredits: number;
    availableCredits: number;
    lastUpdated: Date;
}
export interface CreditUsage {
    companyId: string;
    action: string;
    amount: number;
    cost: number;
    projectId?: string;
    status: 'pending' | 'completed' | 'refunded';
}
export declare class CreditManager {
    /**
     * Obtiene el balance de créditos de una empresa
     */
    static getBalance(companyId: string): Promise<CreditInfo>;
    /**
     * Verifica si hay suficientes créditos
     */
    static hasEnoughCredits(companyId: string, amount: number): Promise<boolean>;
    /**
     * Consume créditos
     */
    static consumeCredits(companyId: string, amount: number, action: string, projectId?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Agrega créditos a una empresa
     */
    static addCredits(companyId: string, amount: number, paymentId?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Obtiene historial de uso
     */
    static getUsageHistory(companyId: string, limit?: number): Promise<CreditUsage[]>;
    /**
     * Calcula costo estimado de una operación
     */
    static calculateCost(provider: string, operation: string): number;
}
export default CreditManager;
