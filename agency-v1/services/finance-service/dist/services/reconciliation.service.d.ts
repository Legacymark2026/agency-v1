export interface BankTransaction {
    id: string;
    amount: number;
    date: Date;
    referenceText: string;
}
export declare class ReconciliationService {
    /**
     * Reconcilia transacciones bancarias contra facturas pendientes usando coincidencia difusa (Fuzzy Matching)
     */
    static reconcileTransactions(companyId: string, transactions: BankTransaction[]): Promise<any[]>;
}
