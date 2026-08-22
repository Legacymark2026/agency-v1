export interface CreateProposalInput {
    companyId: string;
    title: string;
    clientName?: string;
    totalAmount?: number;
    content?: string;
}
export declare class DocumentService {
    /**
     * Obtener propuestas de documentos por empresa
     */
    static getProposals(companyId: string): Promise<any>;
    /**
     * Crear nueva propuesta de documento con transacción atómica
     */
    static createProposal(input: CreateProposalInput): Promise<any>;
}
