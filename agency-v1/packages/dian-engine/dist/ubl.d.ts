export interface DianInvoiceData {
    invoiceNumber: string;
    issueDate: Date;
    totalAmount: number;
    subtotal: number;
    taxes: {
        iva: number;
        ica: number;
        inc: number;
    };
    issuer: {
        nit: string;
        name: string;
        technicalKey: string;
    };
    customer: {
        nit: string;
        name: string;
    };
    environment: "1" | "2";
}
export declare function buildUBL21Invoice(data: DianInvoiceData): {
    xml: string;
    cufe: string;
};
