export interface CreateInvoiceInput {
    companyId: string;
    clientName: string;
    clientNit?: string;
    clientAddress?: string;
    clientCity?: string;
    clientPhone?: string;
    subtotalAmount: number;
    taxAmount?: number;
    discountAmount?: number;
    totalAmount: number;
    notes?: string;
    items?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
}
export declare class FinanceService {
    /**
     * Obtener lista de facturas
     */
    static getInvoices(companyId: string, status?: string): Promise<any>;
    /**
     * Crear nueva factura con transacción atómica
     */
    static createInvoice(input: CreateInvoiceInput): Promise<any>;
    /**
     * Manejar webhooks de Stripe (Suscripciones y Facturas pagadas)
     */
    static handleStripeWebhookEvent(companyId: string, event: {
        type: string;
        data: any;
    }): Promise<{
        processed: boolean;
        event: string;
    }>;
    /**
     * Generar proyección predictiva del flujo de caja (Cash Flow Forecast)
     */
    static getCashFlowForecast(companyId: string): Promise<{
        currentBalance: number;
        projections: {
            month: string;
            incoming: number;
            outgoing: number;
            netFlow: number;
        }[];
    }>;
}
