export declare class WalletService {
    /**
     * Obtiene o inicializa el balance del Wallet prepago de una empresa
     */
    static getWalletBalance(companyId: string): Promise<any>;
    /**
     * Recarga saldo al Wallet prepago de una empresa
     */
    static rechargeWallet(companyId: string, amountUsd: number): Promise<any>;
    /**
     * Configura las opciones de auto-recarga del Wallet
     */
    static updateAutoRechargeConfig(companyId: string, enabled: boolean, threshold: number, amount: number): Promise<any>;
}
